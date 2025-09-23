import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    
    if (!supabase) {
      return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 })
    }
    
    // For now, return mock data since we're focusing on getting the dashboard working
    const mockMetrics = {
      totalClients: 0,
      activeDeals: 0,
      monthlyRevenue: 0,
      conversionRate: 0,
      previousMonth: {
        totalClients: 0,
        activeDeals: 0,
        monthlyRevenue: 0,
        conversionRate: 0,
      }
    }

    return NextResponse.json(mockMetrics)
  } catch (error) {
    console.error('Error fetching dashboard metrics:', error)
    return NextResponse.json(
      { error: 'Failed to fetch metrics' },
      { status: 500 }
    )
  }
}