import { NextRequest, NextResponse } from 'next/server';
import { database } from '@repo/database';
import { currentUser } from '@repo/auth/server';

// GET - Dashboard-optimized data aggregation
export async function GET(request: NextRequest) {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get('clientId');
    const section = searchParams.get('section'); // 'overview', 'revenue', 'risk'

    // Build base query filters
    const baseWhere = {
      brokerId: user.id,
      isActive: true,
      ...(clientId && { clientId }),
    };

    let aggregatedData: any = {};

    if (!section || section === 'overview') {
      // Overview metrics aggregation
      const [metricInsights, clientCount, totalRevenue] = await Promise.all([
        database.clientInsightData.findMany({
          where: { ...baseWhere, category: 'METRIC' },
          include: {
            client: { select: { companyName: true } },
            timeSeries: {
              orderBy: { date: 'desc' },
              take: 12, // Last 12 data points for trends
            },
          },
        }),
        database.brokerClient.count({
          where: { brokerId: user.id },
        }),
        database.brokerClient.aggregate({
          where: { brokerId: user.id },
          _sum: { revenue: true, premium: true },
          _avg: { revenue: true, premium: true },
        }),
      ]);

      aggregatedData.overview = {
        totalClients: clientCount,
        totalRevenue: totalRevenue._sum.revenue || 0,
        totalPremium: totalRevenue._sum.premium || 0,
        avgRevenue: totalRevenue._avg.revenue || 0,
        avgPremium: totalRevenue._avg.premium || 0,
        metrics: metricInsights,
      };
    }

    if (!section || section === 'revenue') {
      // Revenue analytics aggregation
      const [revenueInsights, topClients] = await Promise.all([
        database.clientInsightData.findMany({
          where: { ...baseWhere, category: 'REVENUE' },
          include: {
            client: { select: { companyName: true, revenue: true, premium: true } },
            timeSeries: {
              orderBy: { date: 'desc' },
              take: 24, // Last 24 data points for revenue trends
            },
          },
        }),
        database.brokerClient.findMany({
          where: { brokerId: user.id },
          orderBy: { revenue: 'desc' },
          take: 10,
          select: {
            id: true,
            companyName: true,
            revenue: true,
            premium: true,
            headcount: true,
            renewalDate: true,
          },
        }),
      ]);

      aggregatedData.revenue = {
        insights: revenueInsights,
        topClients,
        totalRevenue: topClients.reduce((sum, client) => sum + Number(client.revenue), 0),
      };
    }

    if (!section || section === 'risk') {
      // Risk and opportunity aggregation
      const [riskInsights, opportunityInsights, renewalsIn90Days] = await Promise.all([
        database.clientInsightData.findMany({
          where: { ...baseWhere, category: 'RISK' },
          include: {
            client: { select: { companyName: true, renewalDate: true } },
          },
        }),
        database.clientInsightData.findMany({
          where: { ...baseWhere, category: 'OPPORTUNITY' },
          include: {
            client: { select: { companyName: true, revenue: true } },
          },
        }),
        database.brokerClient.findMany({
          where: {
            brokerId: user.id,
            renewalDate: {
              gte: new Date(),
              lte: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days from now
            },
          },
          select: {
            id: true,
            companyName: true,
            renewalDate: true,
            revenue: true,
            premium: true,
          },
          orderBy: { renewalDate: 'asc' },
        }),
      ]);

      aggregatedData.risk = {
        riskInsights,
        opportunityInsights,
        upcomingRenewals: renewalsIn90Days,
        riskCount: riskInsights.length,
        opportunityCount: opportunityInsights.length,
      };
    }

    // Calculate growth trends if time series data is available
    if (section === 'overview' || !section) {
      const growthData = await calculateGrowthTrends(user.id, clientId);
      aggregatedData.growth = growthData;
    }

    return NextResponse.json({
      success: true,
      data: aggregatedData,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error aggregating client insights:', error);
    return NextResponse.json(
      { error: 'Failed to aggregate client insights' },
      { status: 500 }
    );
  }
}

async function calculateGrowthTrends(brokerId: string, clientId?: string | null) {
  try {
    // Get revenue growth data for the last 12 months
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

    const timeSeriesData = await database.clientTimeSeries.findMany({
      where: {
        insight: {
          brokerId,
          category: 'REVENUE',
          type: 'monthly_revenue',
          ...(clientId && { clientId }),
        },
        date: { gte: twelveMonthsAgo },
      },
      include: {
        insight: {
          select: { clientId: true, client: { select: { companyName: true } } },
        },
      },
      orderBy: { date: 'asc' },
    });

    // Group by month and calculate totals
    const monthlyTotals: { [key: string]: number } = {};
    timeSeriesData.forEach((point) => {
      const monthKey = point.date.toISOString().substring(0, 7); // YYYY-MM
      const value = typeof point.value === 'object' && point.value && 'amount' in point.value 
        ? Number(point.value.amount) 
        : 0;
      monthlyTotals[monthKey] = (monthlyTotals[monthKey] || 0) + value;
    });

    const chartData = Object.entries(monthlyTotals).map(([month, total]) => ({
      month,
      revenue: total,
    }));

    // Calculate YoY growth if we have enough data
    let yoyGrowth = 0;
    if (chartData.length >= 12) {
      const currentTotal = chartData.slice(-6).reduce((sum, item) => sum + item.revenue, 0);
      const previousTotal = chartData.slice(-12, -6).reduce((sum, item) => sum + item.revenue, 0);
      yoyGrowth = previousTotal > 0 ? ((currentTotal - previousTotal) / previousTotal) * 100 : 0;
    }

    return {
      chartData,
      yoyGrowth: Math.round(yoyGrowth * 100) / 100,
      dataPoints: chartData.length,
    };
  } catch (error) {
    console.error('Error calculating growth trends:', error);
    return {
      chartData: [],
      yoyGrowth: 0,
      dataPoints: 0,
    };
  }
}