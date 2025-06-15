import { NextRequest, NextResponse } from 'next/server';
import { database } from '@repo/database';
import { currentUser } from '@repo/auth/server';
import { z } from 'zod';

// Validation schemas
const InsightDataSchema = z.object({
  clientId: z.string(),
  category: z.enum(['METRIC', 'REVENUE', 'RISK', 'OPPORTUNITY']),
  type: z.string(),
  title: z.string(),
  description: z.string().optional(),
  value: z.any(), // JSON value
  metadata: z.any().optional(), // JSON metadata
  period: z.string().optional(),
  targetValue: z.any().optional(), // JSON target value
  sortOrder: z.number().optional(),
});

const BulkOperationSchema = z.object({
  action: z.enum(['create', 'update', 'delete']),
  items: z.array(z.object({
    id: z.string().optional(),
    data: InsightDataSchema.optional(),
  })),
});

// GET - Intelligent data retrieval with filtering
export async function GET(request: NextRequest) {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get('clientId');
    const category = searchParams.get('category');
    const type = searchParams.get('type');
    const period = searchParams.get('period');
    const includeTimeSeries = searchParams.get('includeTimeSeries') === 'true';

    // Build dynamic where clause
    const where: any = {
      brokerId: user.id,
      isActive: true,
    };

    if (clientId) where.clientId = clientId;
    if (category) where.category = category;
    if (type) where.type = type;
    if (period) where.period = period;

    const insights = await database.clientInsightData.findMany({
      where,
      include: {
        client: {
          select: {
            id: true,
            companyName: true,
            policyNumber: true,
          },
        },
        timeSeries: includeTimeSeries ? {
          orderBy: { date: 'desc' },
          take: 50, // Limit to last 50 data points
        } : false,
      },
      orderBy: [
        { sortOrder: 'asc' },
        { createdAt: 'desc' },
      ],
    });

    return NextResponse.json({
      success: true,
      data: insights,
      count: insights.length,
    });
  } catch (error) {
    console.error('Error fetching client insights:', error);
    return NextResponse.json(
      { error: 'Failed to fetch client insights' },
      { status: 500 }
    );
  }
}

// POST - Multi-action handler (create/update/delete)
export async function POST(request: NextRequest) {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action } = body;

    switch (action) {
      case 'create':
        return await handleCreate(body.data, user.id);
      case 'update':
        return await handleUpdate(body.id, body.data, user.id);
      case 'delete':
        return await handleDelete(body.id, user.id);
      case 'bulk':
        return await handleBulkOperation(body.operations, user.id);
      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Error in client insights operation:', error);
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    );
  }
}

// Helper functions
async function handleCreate(data: any, brokerId: string) {
  const validatedData = InsightDataSchema.parse(data);
  
  const insight = await database.clientInsightData.create({
    data: {
      ...validatedData,
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
  });

  return NextResponse.json({
    success: true,
    data: insight,
  }, { status: 201 });
}

async function handleUpdate(id: string, data: any, brokerId: string) {
  const validatedData = InsightDataSchema.partial().parse(data);
  
  // Verify ownership
  const existing = await database.clientInsightData.findFirst({
    where: { id, brokerId },
  });

  if (!existing) {
    return NextResponse.json(
      { error: 'Insight not found or access denied' },
      { status: 404 }
    );
  }

  const insight = await database.clientInsightData.update({
    where: { id },
    data: validatedData,
    include: {
      client: {
        select: {
          id: true,
          companyName: true,
          policyNumber: true,
        },
      },
    },
  });

  return NextResponse.json({
    success: true,
    data: insight,
  });
}

async function handleDelete(id: string, brokerId: string) {
  // Verify ownership
  const existing = await database.clientInsightData.findFirst({
    where: { id, brokerId },
  });

  if (!existing) {
    return NextResponse.json(
      { error: 'Insight not found or access denied' },
      { status: 404 }
    );
  }

  await database.clientInsightData.delete({
    where: { id },
  });

  return NextResponse.json({
    success: true,
    message: 'Insight deleted successfully',
  });
}

async function handleBulkOperation(operations: any[], brokerId: string) {
  const validatedOps = z.array(BulkOperationSchema).parse(operations);
  const results = [];

  for (const operation of validatedOps) {
    try {
      let result;
      switch (operation.action) {
        case 'create':
          for (const item of operation.items) {
            if (item.data) {
              result = await handleCreate(item.data, brokerId);
              results.push({ action: 'create', success: true, data: result });
            }
          }
          break;
        case 'update':
          for (const item of operation.items) {
            if (item.id && item.data) {
              result = await handleUpdate(item.id, item.data, brokerId);
              results.push({ action: 'update', success: true, data: result });
            }
          }
          break;
        case 'delete':
          for (const item of operation.items) {
            if (item.id) {
              result = await handleDelete(item.id, brokerId);
              results.push({ action: 'delete', success: true, data: result });
            }
          }
          break;
      }
    } catch (error) {
      results.push({ 
        action: operation.action, 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  }

  return NextResponse.json({
    success: true,
    results,
  });
}