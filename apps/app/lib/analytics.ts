import { database as db } from '@repo/database';

interface ShareLinkEvent {
  reportId: string;
  shareToken: string;
  eventType: 'view' | 'password_attempt' | 'download' | 'print';
  userAgent?: string;
  ipAddress?: string;
  referrer?: string;
}

interface ReportEvent {
  reportId: string;
  eventType: 'created' | 'updated' | 'shared' | 'deleted';
  userId: string;
  metadata?: Record<string, any>;
}

/**
 * Track share link access events
 */
export async function trackShareLinkEvent(event: ShareLinkEvent) {
  try {
    // Update access count and last accessed time
    await db.reportShareLink.update({
      where: { shareToken: event.shareToken },
      data: {
        accessCount: { increment: 1 },
        lastAccessedAt: new Date(),
      },
    });

    // Log detailed analytics if needed (could be sent to external analytics service)
    console.log('Share Link Event:', {
      ...event,
      timestamp: new Date().toISOString(),
    });

    // You could integrate with analytics services here:
    // - Google Analytics 4
    // - PostHog
    // - Mixpanel
    // - Custom analytics database table
    
  } catch (error) {
    console.error('Failed to track share link event:', error);
  }
}

/**
 * Track report management events
 */
export async function trackReportEvent(event: ReportEvent) {
  try {
    // Log the event
    console.log('Report Event:', {
      ...event,
      timestamp: new Date().toISOString(),
    });

    // You could store these events in a separate analytics table
    // or send to external analytics service
    
  } catch (error) {
    console.error('Failed to track report event:', error);
  }
}

/**
 * Get analytics data for a specific report
 */
export async function getReportAnalytics(reportId: string) {
  try {
    const shareLinks = await db.reportShareLink.findMany({
      where: { reportId },
      select: {
        id: true,
        shareToken: true,
        accessCount: true,
        lastAccessedAt: true,
        createdAt: true,
        isActive: true,
        expiresAt: true,
      },
    });

    const totalViews = shareLinks.reduce((sum, link) => sum + link.accessCount, 0);
    const activeLinks = shareLinks.filter(link => link.isActive).length;
    const expiredLinks = shareLinks.filter(link => 
      link.expiresAt && link.expiresAt < new Date()
    ).length;

    return {
      totalShareLinks: shareLinks.length,
      activeShareLinks: activeLinks,
      expiredShareLinks: expiredLinks,
      totalViews,
      shareLinks,
      lastViewed: shareLinks
        .filter(link => link.lastAccessedAt)
        .sort((a, b) => new Date(b.lastAccessedAt!).getTime() - new Date(a.lastAccessedAt!).getTime())[0]?.lastAccessedAt,
    };
  } catch (error) {
    console.error('Failed to get report analytics:', error);
    return null;
  }
}

/**
 * Get system-wide analytics for all reports by user
 */
export async function getUserAnalytics(userId: string) {
  try {
    const reports = await db.quoteReport.findMany({
      where: { createdById: userId },
      include: {
        shareLinks: {
          select: {
            accessCount: true,
            isActive: true,
            expiresAt: true,
          },
        },
      },
    });

    const totalReports = reports.length;
    const totalSharedReports = reports.filter(report => report.shareLinks.length > 0).length;
    const totalViews = reports.reduce((sum, report) => 
      sum + report.shareLinks.reduce((linkSum, link) => linkSum + link.accessCount, 0), 0
    );
    const totalActiveLinks = reports.reduce((sum, report) => 
      sum + report.shareLinks.filter(link => link.isActive).length, 0
    );

    return {
      totalReports,
      totalSharedReports,
      totalViews,
      totalActiveLinks,
      averageViewsPerReport: totalReports > 0 ? totalViews / totalReports : 0,
      sharingRate: totalReports > 0 ? totalSharedReports / totalReports : 0,
    };
  } catch (error) {
    console.error('Failed to get user analytics:', error);
    return null;
  }
}