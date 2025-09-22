import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'
import { getSession } from '@/lib/session'

export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const fromDate = searchParams.get('from') || new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0]
    const toDate = searchParams.get('to') || new Date().toISOString().split('T')[0]

    const supabase = createClient()

    // Get closed transactions for the date range
    const { data: transactions, error } = await supabase
      .from('transactions')
      .select(`
        id,
        address,
        price,
        commission_rate,
        gross_commission,
        net_commission,
        broker_commission,
        status,
        closing_date,
        created_at,
        client:clients(
          id,
          name,
          type
        )
      `)
      .eq('status', 'Closed')
      .gte('closing_date', fromDate)
      .lte('closing_date', toDate)
      .order('closing_date', { ascending: true })

    if (error) {
      console.error('Error fetching revenue data:', error)
      return NextResponse.json({ error: 'Failed to fetch revenue data' }, { status: 500 })
    }

    // Calculate revenue analytics
    const analytics = calculateRevenueAnalytics(transactions || [], fromDate, toDate)

    return NextResponse.json({
      data: analytics,
      transactions: transactions || [],
      dateRange: { from: fromDate, to: toDate }
    })
  } catch (error) {
    console.error('Error in GET /api/dashboard/revenue:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

interface Transaction {
  id: string
  address: string
  price: number
  commission_rate: number
  gross_commission: number | null
  net_commission: number | null
  broker_commission: number | null
  status: string
  closing_date: string | null
  created_at: string
  client?: {
    id: string
    name: string
    type: string
  } | null
}

function calculateRevenueAnalytics(transactions: Transaction[], fromDate: string, toDate: string) {
  const currentYear = new Date().getFullYear()
  const previousYear = currentYear - 1

  // Initialize monthly data
  const monthlyRevenue = Array(12).fill(0)
  const monthlyDeals = Array(12).fill(0)
  const monthlyLabels = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ]

  // Process current year transactions
  let totalRevenue = 0
  let totalCommission = 0
  let closedDeals = 0

  transactions.forEach(transaction => {
    if (transaction.closing_date) {
      const closingDate = new Date(transaction.closing_date)
      const month = closingDate.getMonth()
      const year = closingDate.getFullYear()

      if (year === currentYear) {
        const netCommission = transaction.net_commission || 0
        const grossCommission = transaction.gross_commission || 0

        monthlyRevenue[month] += netCommission
        monthlyDeals[month] += 1
        totalRevenue += netCommission
        totalCommission += grossCommission
        closedDeals += 1
      }
    }
  })

  // Calculate averages and growth
  const averageDealSize = closedDeals > 0 ? totalRevenue / closedDeals : 0
  
  // Mock previous year data for growth calculation (in real app, this would be a separate query)
  const previousYearRevenue = totalRevenue * 0.85 // Mock 15% growth
  const yearOverYearGrowth = previousYearRevenue > 0 
    ? ((totalRevenue - previousYearRevenue) / previousYearRevenue) * 100 
    : 0

  // Mock goal data (in real app, this would come from user settings)
  const annualGoal = 500000
  const goalProgress = (totalRevenue / annualGoal) * 100

  // Calculate quarterly data
  const quarterlyRevenue = [
    monthlyRevenue.slice(0, 3).reduce((a, b) => a + b, 0),   // Q1
    monthlyRevenue.slice(3, 6).reduce((a, b) => a + b, 0),   // Q2
    monthlyRevenue.slice(6, 9).reduce((a, b) => a + b, 0),   // Q3
    monthlyRevenue.slice(9, 12).reduce((a, b) => a + b, 0),  // Q4
  ]

  const quarterlyLabels = ['Q1', 'Q2', 'Q3', 'Q4']

  // Calculate trends
  const recentMonths = monthlyRevenue.slice(-6) // Last 6 months
  const trendDirection = calculateTrend(recentMonths)

  return {
    totalRevenue,
    commissionRevenue: totalCommission,
    closedDeals,
    averageDealSize,
    yearOverYearGrowth,
    goalProgress,
    monthlyRevenue,
    monthlyLabels,
    monthlyDeals,
    quarterlyRevenue,
    quarterlyLabels,
    trendDirection,
    metrics: {
      activeMonths: monthlyRevenue.filter(m => m > 0).length,
      peakMonth: monthlyLabels[monthlyRevenue.indexOf(Math.max(...monthlyRevenue))],
      peakRevenue: Math.max(...monthlyRevenue),
      averageMonthly: monthlyRevenue.reduce((a, b) => a + b, 0) / 12,
      conversionRate: 0.15, // Mock data
      averageCommissionRate: transactions.length > 0 
        ? transactions.reduce((sum, t) => sum + t.commission_rate, 0) / transactions.length 
        : 0
    }
  }
}

function calculateTrend(data: number[]): 'up' | 'down' | 'stable' {
  if (data.length < 2) return 'stable'
  
  const firstHalf = data.slice(0, Math.floor(data.length / 2))
  const secondHalf = data.slice(Math.floor(data.length / 2))
  
  const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length
  const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length
  
  const difference = ((secondAvg - firstAvg) / firstAvg) * 100
  
  if (Math.abs(difference) < 5) return 'stable'
  return difference > 0 ? 'up' : 'down'
}