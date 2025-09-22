import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'
import { createAppointmentSchema, appointmentQuerySchema, generateRRule } from '@/lib/validations/appointment'
import { getUser } from '@/lib/session'

// GET /api/appointments - Get appointments with optional filtering
export async function GET(request: NextRequest) {
  try {
    const user = await getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const queryParams = Object.fromEntries(searchParams.entries())
    
    // Convert string booleans to actual booleans
    if (queryParams.is_recurring) {
      queryParams.is_recurring = queryParams.is_recurring === 'true'
    }

    const validatedQuery = appointmentQuerySchema.parse(queryParams)
    
    const supabase = createClient()
    let query = supabase
      .from('appointments')
      .select(`
        *,
        client:clients(id, name, email),
        created_by_profile:profiles!appointments_created_by_fkey(id, name, email)
      `)
      .eq('created_by', user.id)
      .order('start_time', { ascending: true })

    // Apply filters
    if (validatedQuery.client_id) {
      query = query.eq('client_id', validatedQuery.client_id)
    }

    if (validatedQuery.type) {
      query = query.eq('type', validatedQuery.type)
    }

    if (validatedQuery.status) {
      query = query.eq('status', validatedQuery.status)
    }

    if (validatedQuery.start_date) {
      query = query.gte('start_time', validatedQuery.start_date)
    }

    if (validatedQuery.end_date) {
      query = query.lte('start_time', validatedQuery.end_date)
    }

    if (validatedQuery.is_recurring !== undefined) {
      query = query.eq('is_recurring', validatedQuery.is_recurring)
    }

    // Apply pagination
    const page = validatedQuery.page || 1
    const limit = validatedQuery.limit || 50
    const offset = (page - 1) * limit

    query = query.range(offset, offset + limit - 1)

    const { data: appointments, error, count } = await query

    if (error) {
      console.error('Error fetching appointments:', error)
      return NextResponse.json({ error: 'Failed to fetch appointments' }, { status: 500 })
    }

    return NextResponse.json({
      data: appointments,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    })
  } catch (error) {
    console.error('Error in GET /api/appointments:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/appointments - Create a new appointment
export async function POST(request: NextRequest) {
  try {
    const user = await getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = createAppointmentSchema.parse(body)

    const supabase = createClient()

    // If this is a recurring appointment, generate the RRULE if pattern is provided
    let appointmentData = {
      ...validatedData,
      created_by: user.id,
      status: 'Scheduled' as const,
    }

    // Handle recurring appointments
    if (validatedData.is_recurring && body.recurringPattern) {
      appointmentData.recurrence_rule = generateRRule(body.recurringPattern)
    }

    const { data: appointment, error } = await supabase
      .from('appointments')
      .insert(appointmentData)
      .select(`
        *,
        client:clients(id, name, email),
        created_by_profile:profiles!appointments_created_by_fkey(id, name, email)
      `)
      .single()

    if (error) {
      console.error('Error creating appointment:', error)
      return NextResponse.json({ error: 'Failed to create appointment' }, { status: 500 })
    }

    // If this is a recurring appointment, create the recurring instances
    if (validatedData.is_recurring && validatedData.recurrence_rule && body.recurringPattern) {
      try {
        await createRecurringInstances(supabase, appointment, body.recurringPattern)
      } catch (recurringError) {
        console.error('Error creating recurring instances:', recurringError)
        // Don't fail the main appointment creation, just log the error
      }
    }

    return NextResponse.json({ data: appointment }, { status: 201 })
  } catch (error) {
    console.error('Error in POST /api/appointments:', error)
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json({ error: 'Invalid request data', details: error.message }, { status: 400 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Helper function to create recurring appointment instances
async function createRecurringInstances(supabase: any, parentAppointment: any, pattern: any) {
  const instances = generateRecurringInstances(parentAppointment, pattern)
  
  if (instances.length > 0) {
    const { error } = await supabase
      .from('appointments')
      .insert(instances)

    if (error) {
      throw error
    }
  }
}

// Helper function to generate recurring appointment instances
function generateRecurringInstances(parentAppointment: any, pattern: any) {
  const instances = []
  const startDate = new Date(parentAppointment.start_time)
  const endDate = new Date(parentAppointment.end_time)
  const duration = endDate.getTime() - startDate.getTime()
  
  let currentDate = new Date(startDate)
  let count = 0
  const maxCount = pattern.count || 52 // Default to 52 instances (1 year weekly)
  const endLimit = pattern.until ? new Date(pattern.until) : new Date(startDate.getTime() + (365 * 24 * 60 * 60 * 1000)) // 1 year default

  while (count < maxCount && currentDate <= endLimit) {
    // Move to next occurrence based on frequency
    switch (pattern.frequency) {
      case 'DAILY':
        currentDate.setDate(currentDate.getDate() + (pattern.interval || 1))
        break
      case 'WEEKLY':
        currentDate.setDate(currentDate.getDate() + (7 * (pattern.interval || 1)))
        break
      case 'MONTHLY':
        currentDate.setMonth(currentDate.getMonth() + (pattern.interval || 1))
        break
      case 'YEARLY':
        currentDate.setFullYear(currentDate.getFullYear() + (pattern.interval || 1))
        break
    }

    // Check if this occurrence matches the pattern constraints
    if (matchesPattern(currentDate, pattern)) {
      const instanceEndTime = new Date(currentDate.getTime() + duration)
      
      instances.push({
        title: parentAppointment.title,
        description: parentAppointment.description,
        client_id: parentAppointment.client_id,
        start_time: currentDate.toISOString(),
        end_time: instanceEndTime.toISOString(),
        location: parentAppointment.location,
        type: parentAppointment.type,
        status: 'Scheduled',
        is_recurring: true,
        recurrence_rule: parentAppointment.recurrence_rule,
        parent_appointment_id: parentAppointment.id,
        created_by: parentAppointment.created_by,
      })
      
      count++
    }

    // Safety check to prevent infinite loops
    if (count > 365) break
  }

  return instances
}

// Helper function to check if a date matches the recurring pattern
function matchesPattern(date: Date, pattern: any): boolean {
  // Check weekday constraints
  if (pattern.byweekday && pattern.byweekday.length > 0) {
    if (!pattern.byweekday.includes(date.getDay())) {
      return false
    }
  }

  // Check month day constraints
  if (pattern.bymonthday && pattern.bymonthday.length > 0) {
    if (!pattern.bymonthday.includes(date.getDate())) {
      return false
    }
  }

  // Check month constraints
  if (pattern.bymonth && pattern.bymonth.length > 0) {
    if (!pattern.bymonth.includes(date.getMonth() + 1)) {
      return false
    }
  }

  return true
}