import { NextRequest, NextResponse } from 'next/server';
import { database } from '@repo/database';


interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const { id } = await params;
    
    const client = await database.brokerClient.findUnique({
      where: { id },
      include: {
        broker: {
          select: {
            id: true,
            email: true,
          },
        },
        documents: {
          orderBy: { uploadDate: 'desc' },
          include: {
            uploadedBy: {
              select: {
                email: true,
              },
            },
          },
        },
      },
    });

    if (!client) {
      return NextResponse.json(
        { error: 'Client not found' },
        { status: 404 }
      );
    }

    // Transform the data to include additional fields for the detailed view
    // Note: Many of these fields don't exist in the current schema
    // They would need to be added to support the full detailed view
    const detailedClient = {
      id: client.id,
      companyName: client.companyName,
      policyNumber: client.policyNumber,
      renewalDate: client.renewalDate.toISOString(),
      headcount: client.headcount,
      premium: Number(client.premium),
      revenue: Number(client.revenue),
      industry: client.industry,
      createdAt: client.createdAt.toISOString(),
      
      // Broker information
      assignedBroker: client.broker?.email || null,
      brokerEmail: client.broker?.email || null,
      
      // Documents
      documents: client.documents.map((doc: any) => ({
        id: doc.id,
        fileName: doc.fileName,
        fileType: doc.fileType,
        fileUrl: doc.fileUrl,
        uploadDate: doc.uploadDate.toISOString(),
        documentType: doc.documentType,
        description: doc.description,
        uploadedBy: doc.uploadedBy?.email || null,
      })),
      
      // Placeholder fields for extended client data
      // These would be populated once the database schema is extended
      location: null,
      companySize: null,
      ceoName: null,
      ceoEmail: null,
      cfoName: null,
      cfoEmail: null,
      chroName: null,
      chroEmail: null,
      planAdminName: null,
      planAdminEmail: null,
      leadSource: null,
      brokerCommissionSplit: null,
      individualSplits: null,
      planManagementFee: null,
      splitWithAnotherBroker: null,
      currentCarrier: null,
      withCarrierSince: null,
      planType: null,
      totalRevenueLTD: null,
      yoyRevenueGrowth: null,
      yoyHeadcountGrowth: null,
    };

    return NextResponse.json(detailedClient);
  } catch (error) {
    console.error('Error fetching client details:', error);
    return NextResponse.json(
      { error: 'Failed to fetch client details' },
      { status: 500 }
    );
  }
}

// PUT update client information
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const { id } = await params;
    const body = await request.json();
     
    const updatedClient = await database.brokerClient.update({ 
      where: { id },
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
    
    return NextResponse.json(updatedClient);
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
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const { id } = await params;
    
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