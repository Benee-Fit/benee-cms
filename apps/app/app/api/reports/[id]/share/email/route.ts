import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@repo/auth/server';
import { database as db } from '@repo/database';

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
    const { shareToken, recipients, subject, message } = body;

    // Validate required fields
    if (!shareToken || !recipients || !Array.isArray(recipients) || recipients.length === 0) {
      return NextResponse.json(
        { error: 'Share token and recipients are required' },
        { status: 400 }
      );
    }

    // Validate email addresses
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const invalidEmails = recipients.filter((email: string) => !emailRegex.test(email));
    if (invalidEmails.length > 0) {
      return NextResponse.json(
        { error: `Invalid email addresses: ${invalidEmails.join(', ')}` },
        { status: 400 }
      );
    }

    // Check if share link exists and user owns the report
    const shareLink = await db.reportShareLink.findUnique({
      where: { shareToken },
      include: {
        report: {
          include: {
            client: {
              select: {
                companyName: true,
              },
            },
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

    // Create the share URL
    const shareUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/share/${shareToken}`;

    // Prepare email content
    const defaultSubject = `Shared Report: ${shareLink.report.title}`;
    const defaultMessage = `Hello,

I'm sharing a quote comparison report with you: "${shareLink.report.title}"
${shareLink.report.client ? `Client: ${shareLink.report.client.companyName}` : ''}

You can view the report at: ${shareUrl}

${shareLink.password ? 'This report is password protected. I\'ll share the password separately.' : ''}

Best regards`;

    const emailSubject = subject || defaultSubject;
    const emailMessage = message || defaultMessage;

    // Here you would integrate with your email service
    // Examples: SendGrid, Mailgun, AWS SES, Resend, etc.
    
    // For now, we'll simulate sending emails and return success
    console.log('Email would be sent:', {
      to: recipients,
      subject: emailSubject,
      message: emailMessage,
      shareUrl,
    });

    // In a real implementation, you would do something like:
    /*
    import { sendEmail } from '@repo/email';
    
    for (const recipient of recipients) {
      await sendEmail({
        to: recipient,
        subject: emailSubject,
        text: emailMessage,
        html: generateEmailHTML(emailMessage, shareUrl, shareLink.report),
      });
    }
    */

    return NextResponse.json({
      success: true,
      message: `Report shared with ${recipients.length} recipient(s)`,
      shareUrl,
      recipients,
    });

  } catch (error) {
    console.error('Failed to send share email:', error);
    return NextResponse.json(
      { error: 'Failed to send share email' },
      { status: 500 }
    );
  }
}

// Helper function to generate HTML email template
function generateEmailHTML(message: string, shareUrl: string, report: any): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Shared Report</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
          .content { padding: 20px 0; }
          .button { 
            display: inline-block; 
            background: #007bff; 
            color: white; 
            padding: 12px 24px; 
            text-decoration: none; 
            border-radius: 4px; 
            margin: 20px 0; 
          }
          .footer { font-size: 12px; color: #666; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2>📊 Shared Report: ${report.title}</h2>
          </div>
          <div class="content">
            <p style="white-space: pre-line;">${message}</p>
            <a href="${shareUrl}" class="button">View Report</a>
          </div>
          <div class="footer">
            <p>Powered by Benee-Fit CMS</p>
            <p>This is an automated message. Please do not reply to this email.</p>
          </div>
        </div>
      </body>
    </html>
  `;
}