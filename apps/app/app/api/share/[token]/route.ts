import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@repo/auth/server';
import { database as db } from '@repo/database';
import { verifyPassword, isShareLinkValid } from '../../../../lib/security';
import { trackShareLinkEvent } from '../../../../lib/analytics';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  try {
    const shareLink = await db.reportShareLink.findUnique({
      where: {
        shareToken: token,
      },
      include: {
        report: {
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
        },
      },
    });

    if (!shareLink) {
      return NextResponse.json({ error: 'Share link not found' }, { status: 404 });
    }

    if (!isShareLinkValid(shareLink)) {
      return NextResponse.json({ error: 'Share link has expired or is inactive' }, { status: 410 });
    }

    // Check if password is required
    if (shareLink.password) {
      const { searchParams } = new URL(request.url);
      const providedPassword = searchParams.get('password');

      if (!providedPassword) {
        return NextResponse.json(
          { 
            error: 'Password required',
            passwordRequired: true,
          },
          { status: 401 }
        );
      }

      const isPasswordValid = await verifyPassword(providedPassword, shareLink.password);
      if (!isPasswordValid) {
        return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
      }
    }

    // Update access count and last accessed time
    await db.reportShareLink.update({
      where: { id: shareLink.id },
      data: {
        accessCount: shareLink.accessCount + 1,
        lastAccessedAt: new Date(),
      },
    });

    // Track analytics event
    await trackShareLinkEvent({
      reportId: shareLink.reportId,
      shareToken: token,
      eventType: 'view',
      userAgent: request.headers.get('user-agent') || undefined,
      ipAddress: request.headers.get('x-forwarded-for') || 
                 request.headers.get('x-real-ip') || 
                 undefined,
      referrer: request.headers.get('referer') || undefined,
    });

    // Return the report data without sensitive information
    const { password: _, ...safeLinkData } = shareLink;
    
    return NextResponse.json({
      shareLink: safeLinkData,
      report: shareLink.report,
    });
  } catch (error) {
    console.error('Failed to access shared report:', error);
    return NextResponse.json(
      { error: 'Failed to access shared report' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { isActive, expiresAt } = body;

    // Check if share link exists and user owns it
    const shareLink = await db.reportShareLink.findUnique({
      where: {
        shareToken: token,
      },
      include: {
        report: {
          select: {
            createdById: true,
          },
        },
      },
    });

    if (!shareLink) {
      return NextResponse.json({ error: 'Share link not found' }, { status: 404 });
    }

    if (shareLink.report.createdById !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const updatedLink = await db.reportShareLink.update({
      where: { shareToken: token },
      data: {
        ...(isActive !== undefined && { isActive }),
        ...(expiresAt !== undefined && { expiresAt: expiresAt ? new Date(expiresAt) : null }),
        updatedAt: new Date(),
      },
      select: {
        id: true,
        shareToken: true,
        isActive: true,
        accessCount: true,
        lastAccessedAt: true,
        expiresAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json(updatedLink);
  } catch (error) {
    console.error('Failed to update share link:', error);
    return NextResponse.json(
      { error: 'Failed to update share link' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if share link exists and user owns it
    const shareLink = await db.reportShareLink.findUnique({
      where: {
        shareToken: token,
      },
      include: {
        report: {
          select: {
            createdById: true,
          },
        },
      },
    });

    if (!shareLink) {
      return NextResponse.json({ error: 'Share link not found' }, { status: 404 });
    }

    if (shareLink.report.createdById !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    await db.reportShareLink.delete({
      where: { shareToken: token },
    });

    return NextResponse.json({ message: 'Share link deleted successfully' });
  } catch (error) {
    console.error('Failed to delete share link:', error);
    return NextResponse.json(
      { error: 'Failed to delete share link' },
      { status: 500 }
    );
  }
}