import { NextRequest, NextResponse } from 'next/server';
import { database } from '@repo/database';

// GET detailed client information
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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
            createdAt: true,
          },
          orderBy: { companyName: 'asc' },
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

    // Transform the data to include all fields
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
      
      // New fields from schema
      companySize: client.companySize || null,
      companyLocation: client.companyLocation || null,
      leadershipCEO: client.leadershipCEO || null,
      leadershipCFO: client.leadershipCFO || null,
      leadershipCHRO: client.leadershipCHRO || null,
      planAdmin: client.planAdmin || null,
      assignedBroker: client.assignedBroker || client.broker?.email || null,
      leadSource: client.leadSource || null,
      brokerCommissionSplit: client.brokerCommissionSplit ? Number(client.brokerCommissionSplit) : null,
      individualSplits: client.individualSplits || null,
      planManagementFee: client.planManagementFee ? Number(client.planManagementFee) : null,
      splitWithAnotherBroker: client.splitWithAnotherBroker || false,
      currentCarrier: client.currentCarrier || null,
      withCarrierSince: client.withCarrierSince ? client.withCarrierSince.toISOString() : null,
      planType: client.planType || null,
      
      // Broker email for UI
      brokerEmail: client.broker?.email || null,
      
      // Parent company information
      parent: client.parent ? {
        id: client.parent.id,
        companyName: client.parent.companyName,
      } : null,
      
      // Division information
      divisions: client.divisions.map((division: any) => ({
        id: division.id,
        companyName: division.companyName,
        headcount: division.headcount,
        premium: Number(division.premium),
        revenue: Number(division.revenue),
        renewalDate: division.renewalDate.toISOString(),
        industry: division.industry,
        policyNumber: division.policyNumber,
        createdAt: division.createdAt.toISOString(),
      })),
      
      // Total headcount (including divisions if this is a holding company)
      totalHeadcount: client.divisions.length > 0 
        ? client.headcount + client.divisions.reduce((sum: number, div: any) => sum + div.headcount, 0)
        : client.headcount,
      
      // Documents
      documents: client.documents.map((doc: any) => ({
        id: doc.id,
        fileName: doc.fileName,
        fileType: doc.fileType,
        fileUrl: doc.fileUrl,
        uploadDate: doc.uploadDate.toISOString(),
        documentType: doc.documentType,
        description: doc.description,
        documentTitle: doc.documentTitle,
        uploadedBy: doc.uploadedBy?.email || null,
      })),
      
      // Calculated fields (these would need business logic)
      totalRevenueLTD: null,
      yoyRevenueGrowth: null,
      yoyHeadcountGrowth: null,
      
      // For backward compatibility with old UI
      location: client.companyLocation || null,
      ceoName: client.leadershipCEO || null,
      ceoEmail: null, // Email fields can be added later
      cfoName: client.leadershipCFO || null,
      cfoEmail: null,
      chroName: client.leadershipCHRO || null,
      chroEmail: null,
      planAdminName: client.planAdmin || null,
      planAdminEmail: null,
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
  try {
    const { id } = await params;
    const body = await request.json();
    
    // Build update data object
    const updateData: any = {};
    
    // Basic fields
    if (body.companyName !== undefined) updateData.companyName = body.companyName;
    if (body.policyNumber !== undefined) updateData.policyNumber = body.policyNumber;
    if (body.renewalDate !== undefined) updateData.renewalDate = new Date(body.renewalDate);
    if (body.headcount !== undefined) updateData.headcount = body.headcount;
    if (body.premium !== undefined) updateData.premium = body.premium;
    if (body.revenue !== undefined) updateData.revenue = body.revenue;
    if (body.industry !== undefined) updateData.industry = body.industry;
    
    // New fields
    if (body.companySize !== undefined) updateData.companySize = body.companySize;
    if (body.companyLocation !== undefined) updateData.companyLocation = body.companyLocation;
    if (body.leadershipCEO !== undefined) updateData.leadershipCEO = body.leadershipCEO;
    if (body.leadershipCFO !== undefined) updateData.leadershipCFO = body.leadershipCFO;
    if (body.leadershipCHRO !== undefined) updateData.leadershipCHRO = body.leadershipCHRO;
    if (body.planAdmin !== undefined) updateData.planAdmin = body.planAdmin;
    if (body.assignedBroker !== undefined) updateData.assignedBroker = body.assignedBroker;
    if (body.leadSource !== undefined) updateData.leadSource = body.leadSource;
    if (body.brokerCommissionSplit !== undefined) updateData.brokerCommissionSplit = body.brokerCommissionSplit;
    if (body.individualSplits !== undefined) updateData.individualSplits = body.individualSplits;
    if (body.planManagementFee !== undefined) updateData.planManagementFee = body.planManagementFee;
    if (body.splitWithAnotherBroker !== undefined) updateData.splitWithAnotherBroker = body.splitWithAnotherBroker;
    if (body.currentCarrier !== undefined) updateData.currentCarrier = body.currentCarrier;
    if (body.withCarrierSince !== undefined) updateData.withCarrierSince = body.withCarrierSince ? new Date(body.withCarrierSince) : null;
    if (body.planType !== undefined) updateData.planType = body.planType;
    
    // Handle parent relationship
    if (body.parentId !== undefined) {
      if (body.parentId) {
        // Validate parent relationship
        if (body.parentId === id) {
          return NextResponse.json(
            { error: 'A client cannot be its own parent' },
            { status: 400 }
          );
        }
        
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
            { error: 'Cannot assign a division as parent. Divisions can only be created under holding companies.' },
            { status: 400 }
          );
        }
        
        // Check if this client has divisions - holding companies cannot become divisions
        const currentClient = await database.brokerClient.findUnique({
          where: { id },
          include: { divisions: true },
        });
        
        if (currentClient?.divisions && currentClient.divisions.length > 0) {
          return NextResponse.json(
            { error: 'Cannot assign a parent to a holding company that has divisions' },
            { status: 400 }
          );
        }
      }
      updateData.parentId = body.parentId;
    }
    
    // Handle backward compatibility fields
    if (body.location !== undefined && !body.companyLocation) updateData.companyLocation = body.location;
    if (body.ceoName !== undefined && !body.leadershipCEO) updateData.leadershipCEO = body.ceoName;
    if (body.cfoName !== undefined && !body.leadershipCFO) updateData.leadershipCFO = body.cfoName;
    if (body.chroName !== undefined && !body.leadershipCHRO) updateData.leadershipCHRO = body.chroName;
    if (body.planAdminName !== undefined && !body.planAdmin) updateData.planAdmin = body.planAdminName;
    
    const updatedClient = await database.brokerClient.update({
      where: { id },
      data: updateData,
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