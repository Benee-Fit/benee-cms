'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Header } from '../../../components/header';
import { Button } from '@repo/design-system/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@repo/design-system/components/ui/card';
import { Badge } from '@repo/design-system/components/ui/badge';
import { 
  FileText, 
  Calendar, 
  Share2, 
  Download,
  Building2,
  ArrowLeft,
  RefreshCw,
  Eye
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
  data: any;
  documentIds: string[];
  createdBy: {
    id: string;
    email: string;
  };
  shareLinks: Array<{
    id: string;
    isActive: boolean;
    accessCount: number;
    createdAt: string;
  }>;
}

export default function ReportViewPage() {
  const params = useParams();
  const router = useRouter();
  const reportId = params.id as string;
  
  const [report, setReport] = useState<QuoteReport | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchReport = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`/api/reports/${reportId}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Report not found');
        }
        throw new Error(`Failed to fetch report: ${response.status}`);
      }

      const data = await response.json();
      setReport(data);
    } catch (err) {
      console.error('Error fetching report:', err);
      setError(err instanceof Error ? err.message : 'Failed to load report');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (reportId) {
      fetchReport();
    }
  }, [reportId]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleShareReport = async () => {
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

  const handleDownloadReport = () => {
    if (!report) return;
    
    // Create a downloadable JSON file of the report data
    const dataStr = JSON.stringify(report.data, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `${report.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_report.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  if (isLoading) {
    return (
      <>
        <Header pages={['Quote Tool', 'Reports']} page="Loading...">
          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              onClick={() => router.push('/quote-tool/reports')}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Reports
            </Button>
          </div>
        </Header>

        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-6 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="h-4 bg-gray-200 rounded"></div>
                    <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                    <div className="h-4 bg-gray-200 rounded w-4/6"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <Header pages={['Quote Tool', 'Reports']} page="Error">
          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              onClick={() => router.push('/quote-tool/reports')}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Reports
            </Button>
          </div>
        </Header>

        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-12">
                <div className="text-red-600 mb-4">{error}</div>
                <div className="space-x-2">
                  <Button onClick={fetchReport}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Try Again
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => router.push('/quote-tool/reports')}
                  >
                    Back to Reports
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </>
    );
  }

  if (!report) {
    return (
      <>
        <Header pages={['Quote Tool', 'Reports']} page="Not Found">
          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              onClick={() => router.push('/quote-tool/reports')}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Reports
            </Button>
          </div>
        </Header>

        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-12">
                <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Report not found
                </h3>
                <p className="text-gray-600 mb-6">
                  The report you're looking for doesn't exist or you don't have permission to view it.
                </p>
                <Button onClick={() => router.push('/quote-tool/reports')}>
                  Back to Reports
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </>
    );
  }

  return (
    <>
      <Header pages={['Quote Tool', 'Reports']} page={report.title}>
        <div className="flex items-center justify-between w-full">
          <Button
            variant="outline"
            onClick={() => router.push('/quote-tool/reports')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Reports
          </Button>
          
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              onClick={handleShareReport}
            >
              <Share2 className="h-4 w-4 mr-2" />
              Share
            </Button>
            <Button
              variant="outline"
              onClick={handleDownloadReport}
            >
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
          </div>
        </div>
      </Header>

      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        {/* Report Header Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileText className="h-5 w-5 mr-2 text-primary" />
              {report.title}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4 text-gray-500" />
                <div>
                  <div className="text-sm font-medium">Created</div>
                  <div className="text-sm text-gray-600">{formatDate(report.createdAt)}</div>
                </div>
              </div>
              
              {report.client && (
                <div className="flex items-center space-x-2">
                  <Building2 className="h-4 w-4 text-gray-500" />
                  <div>
                    <div className="text-sm font-medium">Client</div>
                    <div className="text-sm text-gray-600">{report.client.companyName}</div>
                  </div>
                </div>
              )}
              
              <div className="flex items-center space-x-2">
                <FileText className="h-4 w-4 text-gray-500" />
                <div>
                  <div className="text-sm font-medium">Documents</div>
                  <div className="text-sm text-gray-600">{report.documentIds.length} files</div>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <Eye className="h-4 w-4 text-gray-500" />
                <div>
                  <div className="text-sm font-medium">Share Status</div>
                  <div className="text-sm text-gray-600">
                    {report.shareLinks.some(link => link.isActive) ? (
                      <Badge variant="secondary">Shared</Badge>
                    ) : (
                      <span>Private</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Report Overview */}
        <Card>
          <CardHeader>
            <CardTitle>Report Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {report.data.carriers && (
                <div>
                  <h4 className="font-medium text-sm text-gray-700 mb-2">Carriers</h4>
                  <div className="space-y-1">
                    {report.data.carriers.map((carrier: string, index: number) => (
                      <Badge key={index} variant="outline">{carrier}</Badge>
                    ))}
                  </div>
                </div>
              )}
              
              {report.data.documents && (
                <div>
                  <h4 className="font-medium text-sm text-gray-700 mb-2">Document Categories</h4>
                  <div className="space-y-1">
                    {Array.from(new Set(report.data.documents.map((doc: any) => doc.category))).map((category: string, index: number) => (
                      <Badge key={index} variant="secondary">{category}</Badge>
                    ))}
                  </div>
                </div>
              )}
              
              {report.data.documents && (
                <div>
                  <h4 className="font-medium text-sm text-gray-700 mb-2">Total Documents</h4>
                  <div className="text-2xl font-bold text-gray-900">
                    {report.data.documents.length}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Premium Comparison */}
        {report.data.documents && report.data.documents.some((doc: any) => doc.processedData?.planOptions && doc.processedData.planOptions.length > 0) && (
          <Card>
            <CardHeader>
              <CardTitle>Premium Comparison</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 border border-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200">
                        Plan Option
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200">
                        Carrier
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200">
                        Category
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200">
                        Monthly Premium
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Rate Guarantee
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {report.data.documents.flatMap((doc: any) => 
                      (doc.processedData?.planOptions || []).flatMap((planOption: any) =>
                        (planOption.carrierProposals || []).map((proposal: any, index: number) => (
                          <tr key={`${doc.category}-${planOption.planOptionName}-${index}`} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 border-r border-gray-200">
                              {planOption.planOptionName}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 border-r border-gray-200">
                              {proposal.carrierName}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap border-r border-gray-200">
                              <Badge variant={doc.category === 'Current' ? 'default' : doc.category === 'Renegotiated' ? 'secondary' : 'outline'}>
                                {doc.category}
                              </Badge>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right border-r border-gray-200">
                              <span className="font-semibold">
                                ${proposal.totalMonthlyPremium ? proposal.totalMonthlyPremium.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2}) : '0.00'}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {proposal.rateGuaranteeText || 'N/A'}
                            </td>
                          </tr>
                        ))
                      )
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Coverage Details */}
        {report.data.documents && report.data.documents.some((doc: any) => doc.coverages && doc.coverages.length > 0) && (
          <Card>
            <CardHeader>
              <CardTitle>Coverage Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 border border-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200">
                        Coverage Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200">
                        Carrier
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200">
                        Category
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200">
                        Lives
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200">
                        Volume
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Unit Rate
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {report.data.documents.flatMap((doc: any) => 
                      (doc.coverages || []).map((coverage: any, index: number) => (
                        <tr key={`${doc.category}-${index}`} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 border-r border-gray-200">
                            {coverage.coverageType}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 border-r border-gray-200">
                            {coverage.carrierName}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap border-r border-gray-200">
                            <Badge variant={doc.category === 'Current' ? 'default' : doc.category === 'Renegotiated' ? 'secondary' : 'outline'}>
                              {doc.category}
                            </Badge>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right border-r border-gray-200">
                            {coverage.lives || 0}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right border-r border-gray-200">
                            {coverage.volume ? coverage.volume.toLocaleString() : 0}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                            ${coverage.unitRate || 0} {coverage.unitRateBasis || ''}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Document Details */}
        {report.data.documents && (
          <Card>
            <CardHeader>
              <CardTitle>Document Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {report.data.documents.map((doc: any, index: number) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <h4 className="font-medium">{doc.metadata?.clientName || 'Unknown Client'}</h4>
                        <Badge variant={doc.category === 'Current' ? 'default' : doc.category === 'Renegotiated' ? 'secondary' : 'outline'}>
                          {doc.category}
                        </Badge>
                        {doc.success && <Badge variant="outline" className="text-green-600">Processed</Badge>}
                      </div>
                      <div className="text-sm text-gray-500">
                        {doc.metadata?.carrierName}
                      </div>
                    </div>
                    
                    {doc.metadata && (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        {doc.metadata.quoteDate && (
                          <div>
                            <span className="font-medium text-gray-700">Quote Date:</span>
                            <div>{doc.metadata.quoteDate}</div>
                          </div>
                        )}
                        {doc.metadata.effectiveDate && (
                          <div>
                            <span className="font-medium text-gray-700">Effective Date:</span>
                            <div>{doc.metadata.effectiveDate}</div>
                          </div>
                        )}
                        {doc.metadata.rateGuarantees && (
                          <div>
                            <span className="font-medium text-gray-700">Rate Guarantees:</span>
                            <div>{doc.metadata.rateGuarantees}</div>
                          </div>
                        )}
                        {doc.metadata.reportPreparedBy && (
                          <div>
                            <span className="font-medium text-gray-700">Prepared By:</span>
                            <div>{doc.metadata.reportPreparedBy}</div>
                          </div>
                        )}
                      </div>
                    )}
                    
                    {doc.coverages && doc.coverages.length > 0 && (
                      <div className="mt-3">
                        <span className="font-medium text-gray-700 text-sm">Coverages:</span>
                        <div className="mt-1 flex flex-wrap gap-1">
                          {doc.coverages.map((coverage: any, covIndex: number) => (
                            <Badge key={covIndex} variant="outline" className="text-xs">
                              {coverage.coverageType}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Raw Data (Expandable) */}
        <Card>
          <CardHeader>
            <CardTitle>Raw Data</CardTitle>
          </CardHeader>
          <CardContent>
            <details className="group">
              <summary className="cursor-pointer text-sm text-gray-600 hover:text-gray-900 group-open:text-gray-900">
                Click to view raw JSON data
              </summary>
              <div className="mt-4 bg-gray-50 rounded-lg p-4">
                <pre className="text-sm overflow-auto max-h-96">
                  {JSON.stringify(report.data, null, 2)}
                </pre>
              </div>
            </details>
          </CardContent>
        </Card>

        {/* Share Links */}
        {report.shareLinks.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Share History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {report.shareLinks.map((link) => (
                  <div key={link.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <div className="flex items-center space-x-2">
                        <Badge variant={link.isActive ? "default" : "secondary"}>
                          {link.isActive ? "Active" : "Inactive"}
                        </Badge>
                        <span className="text-sm text-gray-600">
                          {link.accessCount} views
                        </span>
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        Created {formatDate(link.createdAt)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
}