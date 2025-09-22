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

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const months = parseInt(searchParams.get('months') || '6', 10)

    // Calculate date ranges for the specified number of months
    const now = new Date()
    const monthsData = []
    
    for (let i = months - 1; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0)
      
      monthsData.push({
        month: monthStart.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        start: monthStart.toISOString(),
        end: monthEnd.toISOString(),
      })
    }

    // Fetch data for each month
    const performanceData = await Promise.all(
      monthsData.map(async ({ month, start, end }) => {
        // Get clients created in this month
        const { count: newClients } = await supabase
          .from('clients')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', start)
          .lte('created_at', end)

        // Get deals active or closed in this month
        const { count: activeDeals } = await supabase
          .from('transactions')
          .select('*', { count: 'exact', head: true })
          .or(`status.eq.Active,status.eq.Closed`)
          .gte('created_at', start)
          .lte('created_at', end)

        // Get revenue from closed deals in this month
        const { data: revenueData } = await supabase
          .from('transactions')
          .select('net_commission')
          .eq('status', 'Closed')
          .gte('closing_date', start)
          .lte('closing_date', end)

        const revenue = revenueData?.reduce((sum, transaction) => 
          sum + (transaction.net_commission || 0), 0) || 0

        // Calculate conversion rate for this month
        const { data: conversionData } = await supabase
          .from('clients')
          .select('type')
          .gte('created_at', start)
          .lte('created_at', end)

        const leads = conversionData?.filter(client => client.type === 'Lead').length || 0
        const clients = conversionData?.filter(client => client.type === 'Client').length || 0
        const conversionRate = leads > 0 ? Math.round((clients / leads) * 100) : 0

        return {
          month,
          revenue,
          clients: newClients || 0,
          deals: activeDeals || 0,
          conversionRate,
        }
      })
    )

    // Calculate summary statistics
    const totalRevenue = performanceData.reduce((sum, data) => sum + data.revenue, 0)
    const totalClients = performanceData.reduce((sum, data) => sum + data.clients, 0)
    const totalDeals = performanceData.reduce((sum, data) => sum + data.deals, 0)
    const averageConversionRate = performanceData.length > 0 
      ? Math.round(performanceData.reduce((sum, data) => sum + data.conversionRate, 0) / performanceData.length)
      : 0

    const response = {
      data: performanceData,
      totalRevenue,
      totalClients,
      totalDeals,
      averageConversionRate,
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error fetching performance data:', error)
    return NextResponse.json(
      { error: 'Failed to fetch performance data' },
      { status: 500 }
    )
  }
}