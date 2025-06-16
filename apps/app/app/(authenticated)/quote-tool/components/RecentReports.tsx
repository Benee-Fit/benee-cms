'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@repo/design-system/components/ui/card';
import { Badge } from '@repo/design-system/components/ui/badge';
import { Button } from '@repo/design-system/components/ui/button';
import { 
  FileText, 
  Calendar, 
  Eye, 
  Share2, 
  Trash2,
  Clock,
  Building2,
  ChevronRight,
  RefreshCw
} from 'lucide-react';
import { useRouter } from 'next/navigation';

interface QuoteReport {
  id: string;
  title: string;
  clientId?: string;
  client?: {
    id: string;
    companyName: string;
  };
  createdAt: string;
  updatedAt: string;
  documentIds: string[];
  shareLinks: Array<{
    id: string;
    isActive: boolean;
    accessCount: number;
    createdAt: string;
  }>;
}

interface RecentReportsProps {
  limit?: number;
  showViewAll?: boolean;
}

export default function RecentReports({ limit = 5, showViewAll = true }: RecentReportsProps) {
  const router = useRouter();
  const [reports, setReports] = useState<QuoteReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchReports = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`/api/reports?limit=${limit}&page=1`);
      
      // Handle 404 as empty reports, not an error
      if (response.status === 404) {
        setReports([]);
        return;
      }
      
      if (!response.ok) {
        throw new Error(`Failed to fetch reports: ${response.status}`);
      }

      const data = await response.json();
      setReports(data.reports || []);
    } catch (err) {
      console.error('Error fetching reports:', err);
      setError(err instanceof Error ? err.message : 'Failed to load reports');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [limit]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) return 'Today';
    if (diffDays === 2) return 'Yesterday';
    if (diffDays <= 7) return `${diffDays - 1} days ago`;
    
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
  };

  const handleViewReport = (reportId: string) => {
    // Navigate to report view page
    router.push(`/quote-tool/reports/${reportId}`);
  };

  const handleShareReport = async (reportId: string) => {
    try {
      const response = await fetch(`/api/reports/${reportId}/share`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ expiresInDays: 30 })
      });

      if (response.ok) {
        const { shareUrl } = await response.json();
        await navigator.clipboard.writeText(shareUrl);
        // TODO: Add toast notification
        console.log('Share URL copied to clipboard');
      }
    } catch (error) {
      console.error('Failed to create share link:', error);
    }
  };

  const handleDeleteReport = async (reportId: string) => {
    if (!confirm('Are you sure you want to delete this report?')) return;

    try {
      const response = await fetch(`/api/reports/${reportId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setReports(prev => prev.filter(report => report.id !== reportId));
        // TODO: Add toast notification
        console.log('Report deleted successfully');
      }
    } catch (error) {
      console.error('Failed to delete report:', error);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <FileText className="h-5 w-5 mr-2" />
            Saved Quotes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="flex items-center space-x-3 p-3 border rounded-lg">
                  <div className="w-8 h-8 bg-gray-200 rounded"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <FileText className="h-5 w-5 mr-2" />
            Saved Quotes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <div className="text-red-600 mb-2">{error}</div>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchReports}
              className="flex items-center space-x-2"
            >
              <RefreshCw className="h-4 w-4" />
              <span>Retry</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center">
            <FileText className="h-5 w-5 mr-2" />
            Saved Quotes
          </CardTitle>
          {showViewAll && reports.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/quote-tool/reports')}
              className="flex items-center space-x-1"
            >
              <span>View All</span>
              <ChevronRight className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {reports.length === 0 ? (
          <div className="text-center py-6">
            <div className="inline-flex items-center justify-center w-10 h-10 bg-gray-100 rounded-full mb-3">
              <FileText className="h-5 w-5 text-gray-400" />
            </div>
            <p className="text-sm text-gray-500 mb-3">
              No saved reports yet
            </p>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => router.push('/quote-tool/document-parser')}
              className="text-sm"
            >
              Upload Documents
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {reports.map((report) => (
              <div
                key={report.id}
                className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center space-x-3 flex-1 min-w-0">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                      <FileText className="h-4 w-4 text-blue-600" />
                    </div>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium text-gray-900 truncate">
                      {report.title}
                    </h4>
                    <div className="flex items-center space-x-4 mt-1">
                      <div className="flex items-center space-x-1 text-xs text-gray-500">
                        <Calendar className="h-3 w-3" />
                        <span>{formatDate(report.createdAt)}</span>
                      </div>
                      
                      {report.client && (
                        <div className="flex items-center space-x-1 text-xs text-gray-500">
                          <Building2 className="h-3 w-3" />
                          <span className="truncate max-w-32">{report.client.companyName}</span>
                        </div>
                      )}
                      
                      <div className="flex items-center space-x-1 text-xs text-gray-500">
                        <FileText className="h-3 w-3" />
                        <span>{report.documentIds.length} docs</span>
                      </div>
                      
                      {report.shareLinks.some(link => link.isActive) && (
                        <Badge variant="secondary" className="text-xs">
                          Shared
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-1 flex-shrink-0">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleViewReport(report.id)}
                    className="h-8 w-8 p-0"
                    title="View Report"
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleShareReport(report.id)}
                    className="h-8 w-8 p-0"
                    title="Share Report"
                  >
                    <Share2 className="h-4 w-4" />
                  </Button>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteReport(report.id)}
                    className="h-8 w-8 p-0 text-red-600 hover:text-red-800"
                    title="Delete Report"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}