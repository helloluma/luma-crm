import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    // For now, return mock data since we're focusing on getting the dashboard working
    const mockPerformanceData = {
      data: [
        { month: 'Jul 2024', revenue: 0, clients: 0, deals: 0, conversionRate: 0 },
        { month: 'Aug 2024', revenue: 0, clients: 0, deals: 0, conversionRate: 0 },
        { month: 'Sep 2024', revenue: 0, clients: 0, deals: 0, conversionRate: 0 },
        { month: 'Oct 2024', revenue: 0, clients: 0, deals: 0, conversionRate: 0 },
        { month: 'Nov 2024', revenue: 0, clients: 0, deals: 0, conversionRate: 0 },
        { month: 'Dec 2024', revenue: 0, clients: 0, deals: 0, conversionRate: 0 },
      ],
      totalRevenue: 0,
      totalClients: 0,
      totalDeals: 0,
      averageConversionRate: 0,
    }

    return NextResponse.json(mockPerformanceData)
  } catch (error) {
    console.error('Error fetching performance data:', error)
    return NextResponse.json(
      { error: 'Failed to fetch performance data' },
      { status: 500 }
    )
  }
}