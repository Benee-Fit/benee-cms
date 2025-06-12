import { NextRequest, NextResponse } from 'next/server';
import { database } from '@repo/database';

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

// GET single client
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  const { id } = await params;
  try {
    const client = await database.brokerClient.findUnique({
      where: { id },
      include: { documents: true },
    });
    
    if (!client) {
      return NextResponse.json(
        { error: 'Client not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(client);
  } catch (error) {
    console.error('Error fetching client:', error);
    return NextResponse.json(
      { error: 'Failed to fetch client' },
      { status: 500 }
    );
  }
}

// PUT update client
export async function PUT(
  request: NextRequest,
  { params }: RouteParams
) {
  const { id } = await params;
  try {
    const body = await request.json();
    
    // Check if policy number is being changed and ensure it's unique
    if (body.policyNumber) {
      const existingClient = await database.brokerClient.findFirst({
        where: {
          policyNumber: body.policyNumber,
          NOT: { id },
        },
      });
      
      if (existingClient) {
        return NextResponse.json(
          { error: 'A client with this policy number already exists' },
          { status: 400 }
        );
      }
    }
    
    const client = await database.brokerClient.update({
      where: { id },
      data: {
        companyName: body.companyName,
        policyNumber: body.policyNumber,
        renewalDate: body.renewalDate ? new Date(body.renewalDate) : undefined,
        headcount: body.headcount,
        premium: body.premium,
        revenue: body.revenue,
        industry: body.industry,
      },
    });
    
    return NextResponse.json(client);
  } catch (error) {
    console.error('Error updating client:', error);
    return NextResponse.json(
      { error: 'Failed to update client' },
      { status: 500 }
    );
  }
}

// DELETE client
export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  const { id } = await params;
  try {
    await database.brokerClient.delete({
      where: { id },
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting client:', error);
    return NextResponse.json(
      { error: 'Failed to delete client' },
      { status: 500 }
    );
  }
}