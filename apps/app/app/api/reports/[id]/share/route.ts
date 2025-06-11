import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@repo/auth/server';
import { database as db } from '@repo/database';
import { generateUniqueToken, hashPassword } from '../../../../../lib/security';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { expiresAt, expiresInDays, password } = body;

    // Get the database user ID
    const dbUser = await db.user.findUnique({
      where: { clerkId: user.id },
      select: { id: true }
    });

    if (!dbUser) {
      return NextResponse.json({ error: 'User not found in database' }, { status: 404 });
    }

    // Check if report exists and user owns it
    const report = await db.quoteReport.findFirst({
      where: {
        id: id,
        createdById: dbUser.id,
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

    // Calculate expiration date if expiresInDays is provided
    let finalExpiresAt: Date | null = null;
    if (expiresAt) {
      finalExpiresAt = new Date(expiresAt);
    } else if (expiresInDays) {
      finalExpiresAt = new Date();
      finalExpiresAt.setDate(finalExpiresAt.getDate() + expiresInDays);
    }

    const shareLink = await db.reportShareLink.create({
      data: {
        reportId: id,
        shareToken: shareToken!,
        createdById: dbUser.id,
        expiresAt: finalExpiresAt,
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

    // Don't return the hashed password and generate share URL
    const { password: _, ...safeLinkData } = shareLink;
    
    // Generate the full share URL
    const baseUrl = process.env.NODE_ENV === 'production' 
      ? process.env.VERCEL_URL 
        ? `https://${process.env.VERCEL_URL}`
        : process.env.NEXT_PUBLIC_APP_URL || 'https://app.example.com'
      : 'http://localhost:3000';
      
    const shareUrl = `${baseUrl}/share/${shareToken}`;

    return NextResponse.json({
      ...safeLinkData,
      shareUrl
    }, { status: 201 });
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
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Get the database user ID
    const dbUser = await db.user.findUnique({
      where: { clerkId: user.id },
      select: { id: true }
    });

    if (!dbUser) {
      return NextResponse.json({ error: 'User not found in database' }, { status: 404 });
    }

    // Check if report exists and user owns it
    const report = await db.quoteReport.findFirst({
      where: {
        id: id,
        createdById: dbUser.id,
      },
    });

    if (!report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }

    const shareLinks = await db.reportShareLink.findMany({
      where: {
        reportId: id,
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