import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@repo/auth/server';
import { db } from '@repo/database';
import { generateUniqueToken, hashPassword } from '../../../../../lib/security';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { expiresAt, password } = body;

    // Check if report exists and user owns it
    const report = await db.quoteReport.findFirst({
      where: {
        id: params.id,
        createdById: user.id,
      },
    });

    if (!report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }

    // Generate unique token
    let shareToken: string;
    let isUnique = false;
    
    // Ensure token is unique
    while (!isUnique) {
      shareToken = generateUniqueToken();
      const existing = await db.reportShareLink.findUnique({
        where: { shareToken },
      });
      if (!existing) {
        isUnique = true;
      }
    }

    // Hash password if provided
    let hashedPassword: string | null = null;
    if (password) {
      hashedPassword = await hashPassword(password);
    }

    const shareLink = await db.reportShareLink.create({
      data: {
        reportId: params.id,
        shareToken: shareToken!,
        createdById: user.id,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        password: hashedPassword,
      },
      include: {
        report: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });

    // Don't return the hashed password
    const { password: _, ...safeLinkData } = shareLink;

    return NextResponse.json(safeLinkData, { status: 201 });
  } catch (error) {
    console.error('Failed to create share link:', error);
    return NextResponse.json(
      { error: 'Failed to create share link' },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if report exists and user owns it
    const report = await db.quoteReport.findFirst({
      where: {
        id: params.id,
        createdById: user.id,
      },
    });

    if (!report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }

    const shareLinks = await db.reportShareLink.findMany({
      where: {
        reportId: params.id,
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
        createdBy: {
          select: {
            id: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({ shareLinks });
  } catch (error) {
    console.error('Failed to fetch share links:', error);
    return NextResponse.json(
      { error: 'Failed to fetch share links' },
      { status: 500 }
    );
  }
}