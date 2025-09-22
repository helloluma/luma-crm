import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  try {
    const cookieStore = cookies()
    const supabase = createClient(cookieStore)

    // Verify authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50')
    const days = parseInt(searchParams.get('days') || '30') // Look ahead days
    const priority = searchParams.get('priority') // 'critical', 'high', 'medium', 'low'

    // Calculate date range
    const now = new Date()
    const futureDate = new Date()
    futureDate.setDate(now.getDate() + days)

    // Get user profile to check permissions
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    // Build query based on user role
    let query = supabase
      .from('client_stage_deadlines')
      .select(`
        *,
        client:clients!client_stage_deadlines_client_id_fkey(
          id,
          name,
          type,
          assigned_agent
        ),
        created_by_profile:profiles!client_stage_deadlines_created_by_fkey(
          name,
          avatar_url
        )
      `)
      .gte('deadline', now.toISOString())
      .lte('deadline', futureDate.toISOString())

    // Filter by user permissions
    if (profile?.role !== 'SuperAdmin' && profile?.role !== 'Admin') {
      // Regular users can only see their assigned clients' deadlines
      query = query.eq('clients.assigned_agent', user.id)
    }

    // Apply priority filter if specified
    if (priority) {
      const priorityHours = {
        'critical': -1, // Overdue
        'high': 24,     // Within 24 hours
        'medium': 72,   // Within 72 hours
        'low': 168      // Within 1 week
      }

      const priorityDate = new Date()
      const hours = priorityHours[priority as keyof typeof priorityHours]
      
      if (hours === -1) {
        // Show overdue items
        query = query.lt('deadline', now.toISOString())
      } else {
        priorityDate.setHours(now.getHours() + hours)
        query = query.lte('deadline', priorityDate.toISOString())
      }
    }

    const { data: deadlines, error } = await query
      .order('deadline', { ascending: true })
      .limit(limit)

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch deadlines' },
        { status: 500 }
      )
    }

    // Process deadlines to add priority and status
    const processedDeadlines = (deadlines || []).map(deadline => {
      const deadlineDate = new Date(deadline.deadline)
      const diffHours = (deadlineDate.getTime() - now.getTime()) / (1000 * 60 * 60)
      
      let priority: string
      let status: string

      if (diffHours < 0) {
        priority = 'critical'
        status = 'overdue'
      } else if (diffHours < 24) {
        priority = 'high'
        status = 'urgent'
      } else if (diffHours < 72) {
        priority = 'medium'
        status = 'upcoming'
      } else {
        priority = 'low'
        status = 'normal'
      }

      return {
        ...deadline,
        priority,
        status,
        hours_until_deadline: Math.round(diffHours)
      }
    })

    return NextResponse.json({
      data: processedDeadlines,
      count: processedDeadlines.length,
      message: 'Deadlines retrieved successfully'
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}