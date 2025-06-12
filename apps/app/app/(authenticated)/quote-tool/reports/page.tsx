'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '../../components/header';
import { Button } from '@repo/design-system/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@repo/design-system/components/ui/card';
import { Badge } from '@repo/design-system/components/ui/badge';
import { Input } from '@repo/design-system/components/ui/input';
import { 
  FileText, 
  Calendar, 
  Eye, 
  Share2, 
  Trash2,
  Search,
  Building2,
  Filter,
  SortAsc,
  SortDesc,
  RefreshCw,
  Plus
} from 'lucide-react';

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

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export default function ReportsPage() {
  const router = useRouter();
  const [reports, setReports] = useState<QuoteReport[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'createdAt' | 'title'>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const fetchReports = async (page = 1) => {
    try {
      setIsLoading(true);
      setError(null);

      const params = new URLSearchParams({
        page: page.toString(),
        limit: pagination.limit.toString(),
        ...(searchTerm && { search: searchTerm }),
        sortBy,
        sortOrder
      });

      const response = await fetch(`/api/reports?${params}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch reports: ${response.status}`);
      }

      const data = await response.json();
      setReports(data.reports || []);
      setPagination(data.pagination || pagination);
    } catch (err) {
      console.error('Error fetching reports:', err);
      setError(err instanceof Error ? err.message : 'Failed to load reports');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReports(1);
  }, [searchTerm, sortBy, sortOrder]);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= pagination.pages) {
      fetchReports(newPage);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleViewReport = (reportId: string) => {
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
        alert('Share URL copied to clipboard!');
      }
    } catch (error) {
      console.error('Failed to create share link:', error);
      alert('Failed to create share link');
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
        alert('Report deleted successfully');
      } else {
        throw new Error('Failed to delete report');
      }
    } catch (error) {
      console.error('Failed to delete report:', error);
      alert('Failed to delete report');
    }
  };

  const toggleSort = (field: 'createdAt' | 'title') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  return (
    <>
      <Header pages={['Quote Tool']} page="Reports">
        <div className="flex items-center justify-between w-full">
          <h2 className="text-xl font-semibold">Saved Reports</h2>
          <Button
            onClick={() => router.push('/quote-tool/document-parser')}
            className="flex items-center space-x-2"
          >
            <Plus className="h-4 w-4" />
            <span>New Report</span>
          </Button>
        </div>
      </Header>

      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        {/* Search and Filter Controls */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4 items-center">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search reports..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => toggleSort('createdAt')}
                  className="flex items-center space-x-1"
                >
                  <Calendar className="h-4 w-4" />
                  <span>Date</span>
                  {sortBy === 'createdAt' && (
                    sortOrder === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />
                  )}
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => toggleSort('title')}
                  className="flex items-center space-x-1"
                >
                  <FileText className="h-4 w-4" />
                  <span>Title</span>
                  {sortBy === 'title' && (
                    sortOrder === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />
                  )}
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fetchReports(pagination.page)}
                  className="flex items-center space-x-1"
                >
                  <RefreshCw className="h-4 w-4" />
                  <span>Refresh</span>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Reports List */}
        <Card>
          <CardHeader>
            <CardTitle>
              {pagination.total} Report{pagination.total !== 1 ? 's' : ''}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="flex items-center space-x-4 p-4 border rounded-lg">
                      <div className="w-10 h-10 bg-gray-200 rounded-lg"></div>
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                      </div>
                      <div className="flex space-x-2">
                        <div className="w-8 h-8 bg-gray-200 rounded"></div>
                        <div className="w-8 h-8 bg-gray-200 rounded"></div>
                        <div className="w-8 h-8 bg-gray-200 rounded"></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : error ? (
              <div className="text-center py-8">
                <div className="text-red-600 mb-4">{error}</div>
                <Button onClick={() => fetchReports(pagination.page)}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Try Again
                </Button>
              </div>
            ) : reports.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {searchTerm ? 'No reports found' : 'No reports yet'}
                </h3>
                <p className="text-gray-600 mb-6">
                  {searchTerm 
                    ? 'Try adjusting your search terms or filters.' 
                    : 'Start by uploading documents in the Document Parser to create your first report.'
                  }
                </p>
                <Button onClick={() => router.push('/quote-tool/document-parser')}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Report
                </Button>
              </div>
            ) : (
              <>
                <div className="space-y-3">
                  {reports.map((report) => (
                    <div
                      key={report.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center space-x-4 flex-1 min-w-0">
                        <div className="flex-shrink-0">
                          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                            <FileText className="h-5 w-5 text-blue-600" />
                          </div>
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-medium text-gray-900 truncate">
                            {report.title}
                          </h3>
                          <div className="flex items-center space-x-4 mt-1">
                            <div className="flex items-center space-x-1 text-xs text-gray-500">
                              <Calendar className="h-3 w-3" />
                              <span>{formatDate(report.createdAt)}</span>
                            </div>
                            
                            {report.client && (
                              <div className="flex items-center space-x-1 text-xs text-gray-500">
                                <Building2 className="h-3 w-3" />
                                <span className="truncate max-w-40">{report.client.companyName}</span>
                              </div>
                            )}
                            
                            <div className="flex items-center space-x-1 text-xs text-gray-500">
                              <FileText className="h-3 w-3" />
                              <span>{report.documentIds.length} documents</span>
                            </div>
                            
                            {report.shareLinks.some(link => link.isActive) && (
                              <Badge variant="secondary" className="text-xs">
                                Shared
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2 flex-shrink-0">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewReport(report.id)}
                          className="flex items-center space-x-1"
                        >
                          <Eye className="h-4 w-4" />
                          <span className="hidden sm:inline">View</span>
                        </Button>
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleShareReport(report.id)}
                          className="flex items-center space-x-1"
                        >
                          <Share2 className="h-4 w-4" />
                          <span className="hidden sm:inline">Share</span>
                        </Button>
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteReport(report.id)}
                          className="text-red-600 hover:text-red-800 flex items-center space-x-1"
                        >
                          <Trash2 className="h-4 w-4" />
                          <span className="hidden sm:inline">Delete</span>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Pagination */}
                {pagination.pages > 1 && (
                  <div className="flex items-center justify-between mt-6 pt-4 border-t">
                    <div className="text-sm text-gray-600">
                      Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
                      {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                      {pagination.total} reports
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(pagination.page - 1)}
                        disabled={pagination.page <= 1}
                      >
                        Previous
                      </Button>
                      
                      <span className="text-sm text-gray-600">
                        Page {pagination.page} of {pagination.pages}
                      </span>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(pagination.page + 1)}
                        disabled={pagination.page >= pagination.pages}
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}