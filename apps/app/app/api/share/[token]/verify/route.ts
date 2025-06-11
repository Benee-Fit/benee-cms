import { NextRequest, NextResponse } from 'next/server';
import { db } from '@repo/database';
import { verifyPassword, isShareLinkValid } from '../../../../../lib/security';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  try {
    const body = await request.json();
    const { password } = body;

    if (!password) {
      return NextResponse.json({ error: 'Password is required' }, { status: 400 });
    }

    const shareLink = await db.reportShareLink.findUnique({
      where: {
        shareToken: token,
      },
      select: {
        id: true,
        password: true,
        isActive: true,
        expiresAt: true,
      },
    });

    if (!shareLink) {
      return NextResponse.json({ error: 'Share link not found' }, { status: 404 });
    }

    if (!isShareLinkValid(shareLink)) {
      return NextResponse.json({ error: 'Share link has expired or is inactive' }, { status: 410 });
    }

    if (!shareLink.password) {
      return NextResponse.json({ error: 'This share link is not password protected' }, { status: 400 });
    }

    const isPasswordValid = await verifyPassword(password, shareLink.password);
    
    if (!isPasswordValid) {
      return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
    }

    return NextResponse.json({ 
      success: true,
      message: 'Password verified successfully',
    });
  } catch (error) {
    console.error('Failed to verify password:', error);
    return NextResponse.json(
      { error: 'Failed to verify password' },
      { status: 500 }
    );
  }
}