import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@repo/auth/server';
import { db } from '@repo/database';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const report = await db.quoteReport.findFirst({
      where: {
        id: params.id,
        createdById: user.id,
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
        shareLinks: {
          select: {
            id: true,
            shareToken: true,
            isActive: true,
            accessCount: true,
            lastAccessedAt: true,
            expiresAt: true,
            createdAt: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });

    if (!report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }

    return NextResponse.json(report);
  } catch (error) {
    console.error('Failed to fetch report:', error);
    return NextResponse.json(
      { error: 'Failed to fetch report' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { title, clientId, data } = body;

    // Check if report exists and user owns it
    const existingReport = await db.quoteReport.findFirst({
      where: {
        id: params.id,
        createdById: user.id,
      },
    });

    if (!existingReport) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }

    // Validate client exists if clientId is provided
    if (clientId) {
      const client = await db.brokerClient.findFirst({
        where: {
          id: clientId,
          brokerId: user.id,
        },
      });

      if (!client) {
        return NextResponse.json(
          { error: 'Client not found or unauthorized' },
          { status: 404 }
        );
      }
    }

    const updatedReport = await db.quoteReport.update({
      where: { id: params.id },
      data: {
        ...(title && { title }),
        ...(clientId !== undefined && { clientId: clientId || null }),
        ...(data && { data }),
        updatedAt: new Date(),
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

    return NextResponse.json(updatedReport);
  } catch (error) {
    console.error('Failed to update report:', error);
    return NextResponse.json(
      { error: 'Failed to update report' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if report exists and user owns it
    const existingReport = await db.quoteReport.findFirst({
      where: {
        id: params.id,
        createdById: user.id,
      },
    });

    if (!existingReport) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }

    await db.quoteReport.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: 'Report deleted successfully' });
  } catch (error) {
    console.error('Failed to delete report:', error);
    return NextResponse.json(
      { error: 'Failed to delete report' },
      { status: 500 }
    );
  }
}