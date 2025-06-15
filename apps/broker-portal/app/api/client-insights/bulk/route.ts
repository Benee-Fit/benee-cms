import { NextRequest, NextResponse } from 'next/server';
import { database } from '@repo/database';
import { currentUser } from '@repo/auth/server';
import { z } from 'zod';

// Validation schemas
const BulkCreateSchema = z.object({
  items: z.array(z.object({
    clientId: z.string(),
    category: z.enum(['METRIC', 'REVENUE', 'RISK', 'OPPORTUNITY']),
    type: z.string(),
    title: z.string(),
    description: z.string().optional(),
    value: z.any(),
    metadata: z.any().optional(),
    period: z.string().optional(),
    targetValue: z.any().optional(),
    sortOrder: z.number().optional(),
  })),
});

const BulkUpdateSchema = z.object({
  items: z.array(z.object({
    id: z.string(),
    data: z.object({
      title: z.string().optional(),
      description: z.string().optional(),
      value: z.any().optional(),
      metadata: z.any().optional(),
      period: z.string().optional(),
      targetValue: z.any().optional(),
      sortOrder: z.number().optional(),
      isActive: z.boolean().optional(),
    }),
  })),
});

const BulkDeleteSchema = z.object({
  ids: z.array(z.string()),
});

const SeedDataSchema = z.object({
  clientIds: z.array(z.string()),
  includeHistoricalData: z.boolean().default(false),
});

// POST - Batch operations for efficiency
export async function POST(request: NextRequest) {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { operation } = body;

    switch (operation) {
      case 'create':
        return await handleBulkCreate(body, user.id);
      case 'update':
        return await handleBulkUpdate(body, user.id);
      case 'delete':
        return await handleBulkDelete(body, user.id);
      case 'seed':
        return await handleSeedData(body, user.id);
      case 'import':
        return await handleImport(body, user.id);
      default:
        return NextResponse.json(
          { error: 'Invalid operation' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Error in bulk operation:', error);
    return NextResponse.json(
      { error: 'Failed to process bulk operation' },
      { status: 500 }
    );
  }
}

async function handleBulkCreate(body: any, brokerId: string) {
  const { items } = BulkCreateSchema.parse(body);
  
  const results = await database.$transaction(
    items.map((item) =>
      database.clientInsightData.create({
        data: {
          ...item,
          brokerId,
        },
        include: {
          client: {
            select: {
              id: true,
              companyName: true,
              policyNumber: true,
            },
          },
        },
      })
    )
  );

  return NextResponse.json({
    success: true,
    created: results.length,
    data: results,
  }, { status: 201 });
}

async function handleBulkUpdate(body: any, brokerId: string) {
  const { items } = BulkUpdateSchema.parse(body);
  
  // Verify all items belong to the broker
  const existingItems = await database.clientInsightData.findMany({
    where: {
      id: { in: items.map(item => item.id) },
      brokerId,
    },
    select: { id: true },
  });

  const existingIds = new Set(existingItems.map(item => item.id));
  const validItems = items.filter(item => existingIds.has(item.id));

  if (validItems.length !== items.length) {
    return NextResponse.json(
      { error: 'Some items not found or access denied' },
      { status: 404 }
    );
  }

  const results = await database.$transaction(
    validItems.map((item) =>
      database.clientInsightData.update({
        where: { id: item.id },
        data: item.data,
        include: {
          client: {
            select: {
              id: true,
              companyName: true,
              policyNumber: true,
            },
          },
        },
      })
    )
  );

  return NextResponse.json({
    success: true,
    updated: results.length,
    data: results,
  });
}

async function handleBulkDelete(body: any, brokerId: string) {
  const { ids } = BulkDeleteSchema.parse(body);
  
  // Verify all items belong to the broker
  const existingItems = await database.clientInsightData.findMany({
    where: {
      id: { in: ids },
      brokerId,
    },
    select: { id: true },
  });

  const existingIds = existingItems.map(item => item.id);

  if (existingIds.length !== ids.length) {
    return NextResponse.json(
      { error: 'Some items not found or access denied' },
      { status: 404 }
    );
  }

  await database.$transaction([
    // Delete time series data first
    database.clientTimeSeries.deleteMany({
      where: {
        insightId: { in: existingIds },
      },
    }),
    // Delete insights
    database.clientInsightData.deleteMany({
      where: {
        id: { in: existingIds },
      },
    }),
  ]);

  return NextResponse.json({
    success: true,
    deleted: existingIds.length,
  });
}

async function handleSeedData(body: any, brokerId: string) {
  const { clientIds, includeHistoricalData } = SeedDataSchema.parse(body);
  
  // Verify clients belong to the broker
  const clients = await database.brokerClient.findMany({
    where: {
      id: { in: clientIds },
      brokerId,
    },
  });

  if (clients.length !== clientIds.length) {
    return NextResponse.json(
      { error: 'Some clients not found or access denied' },
      { status: 404 }
    );
  }

  const seedData = [];
  const timeSeriesData = [];

  for (const client of clients) {
    // Create basic metrics
    const metrics = [
      {
        clientId: client.id,
        brokerId,
        category: 'METRIC' as const,
        type: 'total_premium',
        title: 'Total Premium',
        value: { amount: Number(client.premium), currency: 'USD' },
        period: 'annual',
      },
      {
        clientId: client.id,
        brokerId,
        category: 'METRIC' as const,
        type: 'headcount',
        title: 'Employee Count',
        value: { count: client.headcount },
        period: 'current',
      },
      {
        clientId: client.id,
        brokerId,
        category: 'REVENUE' as const,
        type: 'annual_revenue',
        title: 'Annual Revenue',
        value: { amount: Number(client.revenue), currency: 'USD' },
        period: 'annual',
      },
    ];

    seedData.push(...metrics);

    // Add historical data if requested
    if (includeHistoricalData) {
      const now = new Date();
      for (let i = 11; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const variation = 0.8 + (Math.random() * 0.4); // Random variation ±20%
        
        timeSeriesData.push({
          date,
          value: { 
            amount: Math.round(Number(client.revenue) * variation / 12), 
            currency: 'USD' 
          },
          metadata: { generated: true, month: date.getMonth() + 1, year: date.getFullYear() },
        });
      }
    }
  }

  // Create insights
  const createdInsights = await database.$transaction(
    seedData.map((data) =>
      database.clientInsightData.create({ data })
    )
  );

  // Create time series data for revenue insights if requested
  let createdTimeSeries = [];
  if (includeHistoricalData && timeSeriesData.length > 0) {
    const revenueInsights = createdInsights.filter(insight => insight.type === 'annual_revenue');
    
    const timeSeriesWithInsightIds = revenueInsights.flatMap((insight, clientIndex) =>
      timeSeriesData.map((tsData) => ({
        ...tsData,
        insightId: insight.id,
      }))
    );

    createdTimeSeries = await database.$transaction(
      timeSeriesWithInsightIds.map((data) =>
        database.clientTimeSeries.create({ data })
      )
    );
  }

  return NextResponse.json({
    success: true,
    seeded: {
      insights: createdInsights.length,
      timeSeries: createdTimeSeries.length,
      clients: clients.length,
    },
    data: createdInsights,
  }, { status: 201 });
}

async function handleImport(body: any, brokerId: string) {
  // This would handle CSV/JSON import functionality
  // For now, return a placeholder
  return NextResponse.json({
    success: false,
    error: 'Import functionality not yet implemented',
  }, { status: 501 });
}