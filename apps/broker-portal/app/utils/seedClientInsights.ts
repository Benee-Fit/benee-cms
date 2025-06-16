import { database } from '@repo/database';

export async function seedClientInsightsData(brokerId: string) {
  try {
    // First, get some existing clients for this broker
    const clients = await database.brokerClient.findMany({
      where: { brokerId },
      take: 10, // Limit to first 10 clients
    });

    if (clients.length === 0) {
      throw new Error('No clients found for this broker. Please create some clients first.');
    }

    console.log(`Found ${clients.length} clients to create insights for`);

    // Prepare seed data for different insight types
    const seedInsights: Array<{
      clientId: string;
      brokerId: string;
      category: 'METRIC' | 'REVENUE' | 'RISK' | 'OPPORTUNITY';
      type: string;
      title: string;
      description?: string;
      value: any;
      metadata?: any;
      period?: string;
      targetValue?: any;
      sortOrder?: number;
    }> = [];
    const timeSeriesData: Array<{
      date: Date;
      value: any;
      metadata: any;
    }> = [];

    for (const client of clients) {
      // METRIC category insights
      seedInsights.push(
        {
          clientId: client.id,
          brokerId,
          category: 'METRIC' as const,
          type: 'total_premium',
          title: 'Total Premium',
          description: 'Annual premium amount for this client',
          value: { 
            amount: Number(client.premium), 
            currency: 'USD',
            period: 'annual'
          },
          period: 'annual',
          targetValue: { amount: Number(client.premium) * 1.1, currency: 'USD' },
          sortOrder: 1,
        },
        {
          clientId: client.id,
          brokerId,
          category: 'METRIC' as const,
          type: 'headcount',
          title: 'Employee Count',
          description: 'Current number of covered employees',
          value: { count: client.headcount },
          period: 'current',
          sortOrder: 2,
        },
        {
          clientId: client.id,
          brokerId,
          category: 'METRIC' as const,
          type: 'premium_per_employee',
          title: 'Premium per Employee',
          description: 'Average premium cost per covered employee',
          value: { 
            amount: Math.round(Number(client.premium) / client.headcount), 
            currency: 'USD',
            period: 'annual'
          },
          period: 'annual',
          sortOrder: 3,
        }
      );

      // REVENUE category insights
      seedInsights.push(
        {
          clientId: client.id,
          brokerId,
          category: 'REVENUE' as const,
          type: 'annual_revenue',
          title: 'Annual Revenue',
          description: 'Total revenue generated from this client',
          value: { 
            amount: Number(client.revenue), 
            currency: 'USD',
            commissionRate: client.brokerCommissionSplit ? Number(client.brokerCommissionSplit) : 12.0
          },
          period: 'annual',
          targetValue: { amount: Number(client.revenue) * 1.05, currency: 'USD' },
          sortOrder: 1,
        },
        {
          clientId: client.id,
          brokerId,
          category: 'REVENUE' as const,
          type: 'revenue_per_employee',
          title: 'Revenue per Employee',
          description: 'Average revenue per covered employee',
          value: { 
            amount: Math.round(Number(client.revenue) / client.headcount), 
            currency: 'USD',
            period: 'annual'
          },
          period: 'annual',
          sortOrder: 2,
        }
      );

      // RISK category insights based on data analysis
      const riskLevel = calculateRiskLevel(client);
      if (riskLevel !== 'low') {
        seedInsights.push({
          clientId: client.id,
          brokerId,
          category: 'RISK' as const,
          type: riskLevel === 'high' ? 'high_risk_renewal' : 'medium_risk_retention',
          title: riskLevel === 'high' ? 'High Risk Renewal' : 'Retention Risk',
          description: riskLevel === 'high' 
            ? 'Client shows high risk indicators for renewal'
            : 'Client shows moderate retention risk',
          value: { 
            riskLevel,
            factors: getRiskFactors(client),
            renewalDate: client.renewalDate.toISOString(),
            impactAmount: Number(client.revenue)
          },
          period: 'current',
          metadata: {
            daysToRenewal: Math.ceil((client.renewalDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)),
            premiumSize: categorizeClientSize(Number(client.premium)),
          },
          sortOrder: riskLevel === 'high' ? 1 : 2,
        });
      }

      // OPPORTUNITY category insights
      const opportunities = identifyOpportunities(client);
      opportunities.forEach((opportunity, index) => {
        seedInsights.push({
          clientId: client.id,
          brokerId,
          category: 'OPPORTUNITY' as const,
          type: opportunity.type,
          title: opportunity.title,
          description: opportunity.description,
          value: opportunity.value,
          period: 'potential',
          targetValue: opportunity.targetValue,
          metadata: opportunity.metadata,
          sortOrder: index + 1,
        });
      });

      // Generate time series data for revenue tracking (last 12 months)
      for (let i = 11; i >= 0; i--) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        date.setDate(1); // First day of month
        
        // Generate realistic monthly revenue with some variation
        const baseMonthlyRevenue = Number(client.revenue) / 12;
        const variation = 0.8 + (Math.random() * 0.4); // ±20% variation
        const monthlyRevenue = Math.round(baseMonthlyRevenue * variation);
        
        timeSeriesData.push({
          date,
          value: { 
            amount: monthlyRevenue, 
            currency: 'USD',
            month: date.getMonth() + 1,
            year: date.getFullYear()
          },
          metadata: { 
            generated: true, 
            clientName: client.companyName,
            headcount: client.headcount
          },
        });
      }
    }

    console.log(`Prepared ${seedInsights.length} insights for ${clients.length} clients`);

    // Create insights in database
    const createdInsights = await database.$transaction(
      seedInsights.map((insight) =>
        database.clientInsightData.create({ data: insight })
      )
    );

    console.log(`Created ${createdInsights.length} insights`);

    // Create time series data for revenue insights
    const revenueInsights = createdInsights.filter(insight => insight.type === 'annual_revenue');
    const timeSeriesWithInsightIds: Array<{
      date: Date;
      value: any;
      metadata: any;
      insightId: string;
    }> = [];

    for (let i = 0; i < revenueInsights.length; i++) {
      const insight = revenueInsights[i];
      const clientTimeSeries = timeSeriesData.slice(i * 12, (i + 1) * 12);
      
      for (const tsData of clientTimeSeries) {
        timeSeriesWithInsightIds.push({
          ...tsData,
          insightId: insight.id,
        });
      }
    }

    const createdTimeSeries = await database.$transaction(
      timeSeriesWithInsightIds.map((data) =>
        database.clientTimeSeries.create({ data })
      )
    );

    console.log(`Created ${createdTimeSeries.length} time series data points`);

    return {
      success: true,
      created: {
        insights: createdInsights.length,
        timeSeries: createdTimeSeries.length,
        clients: clients.length,
      },
      data: createdInsights,
    };
  } catch (error) {
    console.error('Error seeding client insights:', error);
    throw error;
  }
}

// Helper functions for risk and opportunity analysis
function calculateRiskLevel(client: any): 'low' | 'medium' | 'high' {
  const now = new Date();
  const renewalDate = new Date(client.renewalDate);
  const daysToRenewal = Math.ceil((renewalDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  
  // High risk if renewal is within 60 days and premium is high
  if (daysToRenewal <= 60 && Number(client.premium) > 100000) {
    return 'high';
  }
  
  // Medium risk if renewal is within 90 days or headcount is large
  if (daysToRenewal <= 90 || client.headcount > 200) {
    return 'medium';
  }
  
  return 'low';
}

function getRiskFactors(client: any): string[] {
  const factors = [];
  const now = new Date();
  const renewalDate = new Date(client.renewalDate);
  const daysToRenewal = Math.ceil((renewalDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  
  if (daysToRenewal <= 60) factors.push('Renewal due soon');
  if (Number(client.premium) > 200000) factors.push('High premium client');
  if (client.headcount > 300) factors.push('Large group size');
  if (!client.planAdmin) factors.push('No plan admin assigned');
  
  return factors;
}

function categorizeClientSize(premium: number): string {
  if (premium > 500000) return 'Enterprise';
  if (premium > 100000) return 'Large';
  if (premium > 50000) return 'Medium';
  return 'Small';
}

function identifyOpportunities(client: any) {
  const opportunities = [];
  
  // Growth opportunity if headcount could increase
  if (client.headcount < 500 && Number(client.premium) > 50000) {
    opportunities.push({
      type: 'growth_potential',
      title: 'Growth Potential',
      description: 'Client showing signs of business growth',
      value: { 
        potentialIncrease: Math.round(client.headcount * 0.2),
        estimatedRevenue: Math.round(Number(client.revenue) * 0.15),
        currency: 'USD'
      },
      targetValue: { 
        amount: Math.round(Number(client.revenue) * 1.15), 
        currency: 'USD' 
      },
      metadata: {
        likelihood: 'medium',
        timeframe: '6-12 months',
        factors: ['Stable industry', 'Consistent premium payments']
      }
    });
  }
  
  // Cross-sell opportunity if only basic coverage
  if (!client.planType || client.planType === 'basic') {
    opportunities.push({
      type: 'cross_sell',
      title: 'Cross-sell Opportunity',
      description: 'Opportunity for additional product lines',
      value: { 
        products: ['Dental', 'Vision', 'Life Insurance'],
        estimatedRevenue: Math.round(Number(client.revenue) * 0.25),
        currency: 'USD'
      },
      targetValue: { 
        amount: Math.round(Number(client.revenue) * 1.25), 
        currency: 'USD' 
      },
      metadata: {
        likelihood: 'high',
        timeframe: '3-6 months',
        nextSteps: ['Schedule benefits review', 'Prepare proposals']
      }
    });
  }
  
  return opportunities;
}