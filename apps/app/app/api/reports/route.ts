import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@repo/auth/server';
import { database as db } from '@repo/database';

export async function GET(request: NextRequest) {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const clientId = searchParams.get('clientId');

    const where = {
      createdById: user.id,
      ...(clientId && { clientId }),
    };

    const [reports, total] = await Promise.all([
      db.quoteReport.findMany({
        where,
        include: {
          client: {
            select: {
              id: true,
              companyName: true,
            },
          },
          createdBy: {
            select: {
              id: true,
              email: true,
            },
          },
          shareLinks: {
            select: {
              id: true,
              isActive: true,
              accessCount: true,
              createdAt: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.quoteReport.count({ where }),
    ]);

    return NextResponse.json({
      reports,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Failed to fetch reports:', error);
    return NextResponse.json(
      { error: 'Failed to fetch reports' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('[DEBUG] POST /api/reports - Starting request processing');
    
    // Test database connection
    try {
      await db.$connect();
      console.log('[DEBUG] Database connected successfully');
    } catch (dbError) {
      console.error('[DEBUG] Database connection failed:', dbError);
      return NextResponse.json(
        { error: 'Database connection failed' },
        { status: 500 }
      );
    }
    
    const user = await currentUser();
    console.log('[DEBUG] Current user:', user ? { id: user.id, email: user.emailAddress || user.primaryEmailAddress?.emailAddress } : 'No user found');
    
    if (!user) {
      console.log('[DEBUG] No user found, returning 401');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    console.log('[DEBUG] Request body:', JSON.stringify(body, null, 2));
    
    const { title, clientId, data, documentIds } = body;

    // Validate required fields
    if (!title || !data) {
      console.log('[DEBUG] Validation failed - missing title or data');
      return NextResponse.json(
        { error: 'Title and data are required' },
        { status: 400 }
      );
    }
    
    console.log('[DEBUG] Basic validation passed');

    // Validate client exists if clientId is provided
    if (clientId) {
      console.log('[DEBUG] Validating client:', clientId);
      const client = await db.brokerClient.findFirst({
        where: {
          id: clientId,
          brokerId: user.id,
        },
      });

      if (!client) {
        console.log('[DEBUG] Client not found or unauthorized');
        return NextResponse.json(
          { error: 'Client not found or unauthorized' },
          { status: 404 }
        );
      }
      console.log('[DEBUG] Client validation passed');
    }

    console.log('[DEBUG] Creating report with data:', {
      title,
      clientId: clientId || null,
      createdById: user.id,
      documentIds: documentIds || [],
      dataKeys: Object.keys(data || {})
    });

    const report = await db.quoteReport.create({
      data: {
        title,
        clientId: clientId || null,
        createdById: user.id,
        data,
        documentIds: documentIds || [],
      },
      include: {
        client: {
          select: {
            id: true,
            companyName: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            email: true,
          },
        },
      },
    });

    console.log('[DEBUG] Report created successfully:', report.id);
    return NextResponse.json(report, { status: 201 });
  } catch (error) {
    console.error('Failed to create report:', error);
    return NextResponse.json(
      { error: 'Failed to create report' },
      { status: 500 }
    );
  }
}