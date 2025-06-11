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
import SummaryStats from '../../document-parser/results/components/SummaryStats';
import MarketComparisonView from '../../document-parser/results/components/market-comparison/MarketComparisonView';
import CarrierOverviewCards from '../../document-parser/results/components/CarrierOverviewCards';
import type { ParsedDocument } from '../../document-parser/types';

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

// Transform saved report data to ParsedDocument format
const transformReportDataToParsedDocuments = (reportData: any): ParsedDocument[] => {
  if (!reportData.documents) return [];
  
  return reportData.documents.map((doc: any) => {
    // Extract the full processedData if available
    const processedData = doc.processedData || {};
    
    // Build the transformed document
    const transformedDoc: ParsedDocument = {
      originalFileName: doc.metadata?.fileName || `${doc.metadata?.clientName} - ${doc.metadata?.carrierName}.pdf` || 'Unknown Document',
      category: doc.category || 'Current',
      metadata: {
        documentType: doc.metadata?.documentType || 'Proposal',
        clientName: doc.metadata?.clientName || 'Unknown Client',
        carrierName: doc.metadata?.carrierName || 'Unknown Carrier',
        effectiveDate: doc.metadata?.effectiveDate || '',
        quoteDate: doc.metadata?.quoteDate || '',
        policyNumber: doc.metadata?.policyNumber || undefined,
        planOptionName: doc.planOptionName || 'Default Plan',
        totalProposedMonthlyPlanPremium: processedData.planOptions?.[0]?.carrierProposals?.[0]?.totalMonthlyPremium || 0,
        fileName: doc.metadata?.fileName || 'unknown.pdf',
        fileCategory: doc.category || 'Current',
        planOptionTotals: processedData.planOptions?.map((option: any) => ({
          planOptionName: option.planOptionName,
          totalMonthlyPremium: option.carrierProposals?.[0]?.totalMonthlyPremium || 0
        })) || [],
        rateGuarantees: doc.metadata?.rateGuarantees || ''
      },
      coverages: doc.coverages?.map((coverage: any) => ({
        coverageType: coverage.coverageType || 'Unknown Coverage',
        carrierName: coverage.carrierName || doc.metadata?.carrierName || 'Unknown Carrier',
        planOptionName: coverage.planOptionName || 'Default Plan',
        premium: coverage.premium || coverage.monthlyPremium || 0,
        monthlyPremium: coverage.monthlyPremium || 0,
        unitRate: coverage.unitRate || 0,
        unitRateBasis: coverage.unitRateBasis || '',
        volume: coverage.volume || 0,
        lives: coverage.lives || 0,
        benefitDetails: coverage.benefitDetails || {}
      })) || [],
      planNotes: doc.planNotes || [],
      // Pass through the full processedData structure
      processedData: processedData
    };
    
    // If we have granularBreakdown data (new format), ensure it's included
    if (processedData.granularBreakdown) {
      transformedDoc.processedData = {
        ...processedData,
        highLevelOverview: processedData.highLevelOverview || [],
        granularBreakdown: processedData.granularBreakdown || []
      };
    }
    
    // If we have planOptions (legacy format), ensure the full structure is preserved
    if (processedData.planOptions) {
      transformedDoc.processedData = {
        ...processedData,
        metadata: processedData.metadata || doc.metadata,
        planOptions: processedData.planOptions,
        allCoverages: processedData.allCoverages || doc.coverages || []
      };
    }
    
    return transformedDoc;
  });
};

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

        {/* Summary Stats */}
        {report.data && report.data.documents && (() => {
          const transformedDocuments = transformReportDataToParsedDocuments(report.data);
          return <SummaryStats parsedDocuments={transformedDocuments} />;
        })()}

        {/* Comparison Tables */}
        {report.data && report.data.documents && (() => {
          const transformedDocuments = transformReportDataToParsedDocuments(report.data);
          const carriersMap = Object.fromEntries((report.data.carriers || []).map((carrier: string) => [
            carrier, 
            transformedDocuments
              .filter(doc => doc.metadata?.carrierName === carrier)
              .map(doc => doc.originalFileName)
          ]));
          
          return (
            <div className="space-y-8">
              {/* Use MarketComparisonView with transformed data */}
              <MarketComparisonView 
                parsedDocuments={transformedDocuments}
                carriersMap={carriersMap}
              />
              
              {/* Carrier Overview Cards */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Carrier Summary</h3>
                <CarrierOverviewCards parsedDocuments={transformedDocuments} />
              </div>
            </div>
          );
        })()}

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