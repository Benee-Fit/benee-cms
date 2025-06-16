import { NextRequest, NextResponse } from 'next/server';
import { database } from '@repo/database';

// GET all clients with parent-child hierarchy
export async function GET() {
  try {
    const clients = await database.brokerClient.findMany({
      include: {
        parent: {
          select: {
            id: true,
            companyName: true,
          },
        },
        divisions: {
          select: {
            id: true,
            companyName: true,
            headcount: true,
            premium: true,
            revenue: true,
            renewalDate: true,
            industry: true,
            policyNumber: true,
          },
          orderBy: { companyName: 'asc' },
        },
      },
      orderBy: [
        { parentId: { sort: 'asc', nulls: 'first' } },
        { companyName: 'asc' },
      ],
    });
    
    return NextResponse.json(clients);
  } catch (error) {
    console.error('Error fetching clients:', error);
    return NextResponse.json(
      { error: 'Failed to fetch clients' },
      { status: 500 }
    );
  }
}

// POST create new client
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Check for duplicate policy number
    const existingClient = await database.brokerClient.findUnique({
      where: { policyNumber: body.policyNumber },
    });
    
    if (existingClient) {
      return NextResponse.json(
        { error: 'A client with this policy number already exists' },
        { status: 400 }
      );
    }
    
    // Validate parent relationship if parentId is provided
    if (body.parentId) {
      // Check if parent exists
      const parent = await database.brokerClient.findUnique({
        where: { id: body.parentId },
        include: { parent: true },
      });
      
      if (!parent) {
        return NextResponse.json(
          { error: 'Parent company not found' },
          { status: 400 }
        );
      }
      
      // Prevent creating divisions under divisions (enforce one-level hierarchy)
      if (parent.parent) {
        return NextResponse.json(
          { error: 'Cannot create a division under another division. Divisions can only be created under holding companies.' },
          { status: 400 }
        );
      }
    }
    
    const client = await database.brokerClient.create({
      data: {
        companyName: body.companyName,
        policyNumber: body.policyNumber,
        renewalDate: new Date(body.renewalDate),
        headcount: body.headcount,
        premium: body.premium,
        revenue: body.revenue,
        industry: body.industry,
        parentId: body.parentId || null,
      },
    });
    
    return NextResponse.json(client, { status: 201 });
  } catch (error) {
    console.error('Error creating client:', error);
    return NextResponse.json(
      { error: 'Failed to create client' },
      { status: 500 }
    );
  }
}