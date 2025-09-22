import { NextRequest, NextResponse } from 'next/server'
import { commissionCalculationSchema } from '@/lib/validations/transaction'
import { getSession } from '@/lib/session'

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { price, commission_rate, broker_split } = commissionCalculationSchema.parse(body)

    // Calculate commission breakdown
    const grossCommission = (price * commission_rate) / 100
    const brokerCommission = (grossCommission * broker_split) / 100
    const netCommission = grossCommission - brokerCommission

    const calculation = {
      price,
      commission_rate,
      broker_split,
      gross_commission: grossCommission,
      broker_commission: brokerCommission,
      net_commission: netCommission,
      breakdown: {
        price_formatted: new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
        }).format(price),
        gross_commission_formatted: new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
        }).format(grossCommission),
        broker_commission_formatted: new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
        }).format(brokerCommission),
        net_commission_formatted: new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
        }).format(netCommission),
        commission_rate_formatted: `${commission_rate}%`,
        broker_split_formatted: `${broker_split}%`,
      }
    }

    return NextResponse.json({ data: calculation })
  } catch (error) {
    console.error('Error in POST /api/transactions/calculate-commission:', error)
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}