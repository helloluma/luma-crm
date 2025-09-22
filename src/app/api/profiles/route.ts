import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'
import { cookies } from 'next/headers'

// GET /api/profiles - Get profiles with optional role filtering
export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const roleParam = searchParams.get('role')

    let query = supabase
      .from('profiles')
      .select('id, name, email, role, avatar_url, created_at, updated_at')
      .order('name')

    // Filter by roles if provided
    if (roleParam) {
      const roles = roleParam.split(',').map(r => r.trim())
      query = query.in('role', roles)
    }

    const { data: profiles, error } = await query

    if (error) {
      console.error('Error fetching profiles:', error)
      return NextResponse.json({ error: 'Failed to fetch profiles' }, { status: 500 })
    }

    return NextResponse.json({ data: profiles })
  } catch (error) {
    console.error('Unexpected error in GET /api/profiles:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}