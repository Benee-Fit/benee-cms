import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@repo/auth/server';
import { database as db } from '@repo/database';

export async function GET(request: NextRequest) {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the database user ID
    const dbUser = await db.user.findUnique({
      where: { clerkId: user.id },
      select: { id: true }
    });

    if (!dbUser) {
      return NextResponse.json({ error: 'User not found in database' }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 50); // Cap at 50
    const clientId = searchParams.get('clientId');
    const search = searchParams.get('search');
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    // Build the where clause
    const where: any = {
      createdById: dbUser.id,
      ...(clientId && { clientId }),
    };

    // Add search functionality
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { client: { companyName: { contains: search, mode: 'insensitive' } } }
      ];
    }

    // Build the orderBy clause
    const validSortFields = ['createdAt', 'updatedAt', 'title'];
    const orderBy: any = {};
    if (validSortFields.includes(sortBy)) {
      orderBy[sortBy] = sortOrder === 'asc' ? 'asc' : 'desc';
    } else {
      orderBy.createdAt = 'desc'; // Default
    }

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
        orderBy,
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
    console.log('[DEBUG] Current user:', user ? { 
      id: user.id, 
      email: user.primaryEmailAddress?.emailAddress,
      fullUser: JSON.stringify(user, null, 2)
    } : 'No user found');
    
    if (!user) {
      console.log('[DEBUG] No user found, returning 401');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Validate user.id exists and is a string
    if (!user.id || typeof user.id !== 'string') {
      console.error('[DEBUG] Invalid user.id:', user.id);
      return NextResponse.json({ error: 'Invalid user ID' }, { status: 400 });
    }

    // Check if user exists in database
    console.log('[DEBUG] Checking if user exists in database with clerkId:', user.id);
    const dbUser = await db.user.findUnique({
      where: { clerkId: user.id },
      select: { id: true, email: true, userType: true }
    });

    let userId: string;

    if (!dbUser) {
      console.error('[DEBUG] User not found in database with clerkId:', user.id);
      
      // Create user in database if they don't exist
      console.log('[DEBUG] Creating new user in database');
      try {
        const newUser = await db.user.create({
          data: {
            clerkId: user.id,
            email: user.primaryEmailAddress?.emailAddress || `user-${user.id}@unknown.com`,
            userType: 'USER', // Default user type
            accessLevel: 'USER', // Default access level
          },
          select: { id: true, email: true, userType: true }
        });
        console.log('[DEBUG] Created new user:', newUser);
        
        // Use the new user's database ID
        userId = newUser.id;
      } catch (createError) {
        console.error('[DEBUG] Failed to create user:', createError);
        return NextResponse.json({ 
          error: 'Failed to create user account',
          details: createError instanceof Error ? createError.message : 'Unknown error'
        }, { status: 500 });
      }
    } else {
      console.log('[DEBUG] Found existing user in database:', dbUser);
      userId = dbUser.id;
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

    // Validate data types
    if (typeof title !== 'string') {
      console.log('[DEBUG] Validation failed - title is not a string:', typeof title);
      return NextResponse.json(
        { error: 'Title must be a string' },
        { status: 400 }
      );
    }

    if (typeof data !== 'object' || data === null) {
      console.log('[DEBUG] Validation failed - data is not an object:', typeof data);
      return NextResponse.json(
        { error: 'Data must be an object' },
        { status: 400 }
      );
    }

    // Try to serialize data to ensure it's JSON-serializable
    try {
      JSON.stringify(data);
    } catch (serializationError) {
      console.error('[DEBUG] Data serialization failed:', serializationError);
      return NextResponse.json(
        { error: 'Data must be JSON-serializable' },
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

    console.log('[DEBUG] Attempting to create report with:', {
      title,
      clientId: clientId || null,
      createdById: userId,
      dataType: typeof data,
      dataKeys: Object.keys(data || {}),
      documentIds: documentIds || [],
    });

    const report = await db.quoteReport.create({
      data: {
        title,
        clientId: clientId || null,
        createdById: userId,
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
    console.error('[DEBUG] Failed to create report - Full error:', error);
    console.error('[DEBUG] Error name:', error?.name);
    console.error('[DEBUG] Error message:', error?.message);
    console.error('[DEBUG] Error stack:', error?.stack);
    
    // Return more specific error information
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return NextResponse.json(
      { 
        error: 'Failed to create report',
        details: errorMessage,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}