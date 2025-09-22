import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get current date ranges
    const now = new Date()
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const previousMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const previousMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0)

    // Fetch current month metrics
    const [
      { count: totalClients },
      { count: activeDeals },
      { data: revenueData },
      { data: conversionData }
    ] = await Promise.all([
      // Total clients
      supabase
        .from('clients')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', currentMonthStart.toISOString()),
      
      // Active deals
      supabase
        .from('transactions')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'Active'),
      
      // Monthly revenue (sum of net_commission for closed deals this month)
      supabase
        .from('transactions')
        .select('net_commission')
        .eq('status', 'Closed')
        .gte('closing_date', currentMonthStart.toISOString()),
      
      // Conversion data (clients that moved from Lead to Client this month)
      supabase
        .from('clients')
        .select('type, created_at')
        .gte('created_at', currentMonthStart.toISOString())
    ])

    // Fetch previous month metrics for comparison
    const [
      { count: prevTotalClients },
      { data: prevRevenueData },
      { data: prevConversionData }
    ] = await Promise.all([
      // Previous month clients
      supabase
        .from('clients')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', previousMonthStart.toISOString())
        .lt('created_at', previousMonthEnd.toISOString()),
      
      // Previous month revenue
      supabase
        .from('transactions')
        .select('net_commission')
        .eq('status', 'Closed')
        .gte('closing_date', previousMonthStart.toISOString())
        .lt('closing_date', previousMonthEnd.toISOString()),
      
      // Previous month conversion data
      supabase
        .from('clients')
        .select('type, created_at')
        .gte('created_at', previousMonthStart.toISOString())
        .lt('created_at', previousMonthEnd.toISOString())
    ])

    // Calculate metrics
    const monthlyRevenue = revenueData?.reduce((sum, transaction) => 
      sum + (transaction.net_commission || 0), 0) || 0
    
    const prevMonthlyRevenue = prevRevenueData?.reduce((sum, transaction) => 
      sum + (transaction.net_commission || 0), 0) || 0

    // Calculate conversion rate (percentage of leads that became clients)
    const currentLeads = conversionData?.filter(client => client.type === 'Lead').length || 0
    const currentClients = conversionData?.filter(client => client.type === 'Client').length || 0
    const conversionRate = currentLeads > 0 ? Math.round((currentClients / currentLeads) * 100) : 0

    const prevLeads = prevConversionData?.filter(client => client.type === 'Lead').length || 0
    const prevClients = prevConversionData?.filter(client => client.type === 'Client').length || 0
    const prevConversionRate = prevLeads > 0 ? Math.round((prevClients / prevLeads) * 100) : 0

    // Get active deals from previous month for comparison
    const { count: prevActiveDeals } = await supabase
      .from('transactions')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'Active')
      .gte('created_at', previousMonthStart.toISOString())
      .lt('created_at', previousMonthEnd.toISOString())

    const metrics = {
      totalClients: totalClients || 0,
      activeDeals: activeDeals || 0,
      monthlyRevenue,
      conversionRate,
      previousMonth: {
        totalClients: prevTotalClients || 0,
        activeDeals: prevActiveDeals || 0,
        monthlyRevenue: prevMonthlyRevenue,
        conversionRate: prevConversionRate,
      }
    }

    return NextResponse.json(metrics)
  } catch (error) {
    console.error('Error fetching dashboard metrics:', error)
    return NextResponse.json(
      { error: 'Failed to fetch metrics' },
      { status: 500 }
    )
  }
}