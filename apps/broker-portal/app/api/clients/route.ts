import { NextRequest, NextResponse } from 'next/server';
import { database } from '@repo/database';

// GET all clients
export async function GET() {
  try {
    const clients = await database.client.findMany({
      orderBy: { createdAt: 'desc' },
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
    const existingClient = await database.client.findUnique({
      where: { policyNumber: body.policyNumber },
    });
    
    if (existingClient) {
      return NextResponse.json(
        { error: 'A client with this policy number already exists' },
        { status: 400 }
      );
    }
    
    const client = await database.client.create({
      data: {
        companyName: body.companyName,
        policyNumber: body.policyNumber,
        renewalDate: new Date(body.renewalDate),
        headcount: body.headcount,
        premium: body.premium,
        revenue: body.revenue,
        industry: body.industry,
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