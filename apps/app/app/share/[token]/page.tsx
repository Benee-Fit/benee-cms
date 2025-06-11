'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@repo/design-system/components/ui/card';
import { Button } from '@repo/design-system/components/ui/button';
import { Input } from '@repo/design-system/components/ui/input';
import { Label } from '@repo/design-system/components/ui/label';
import { Alert, AlertDescription } from '@repo/design-system/components/ui/alert';
import { Badge } from '@repo/design-system/components/ui/badge';
import { Lock, AlertCircle, FileText, Download, Eye } from 'lucide-react';
import { format } from 'date-fns';
import SharedReportView from '../../../components/shared-report-view';

interface ReportData {
  shareLink: {
    id: string;
    shareToken: string;
    isActive: boolean;
    accessCount: number;
    createdAt: string;
  };
  report: {
    id: string;
    title: string;
    data: any;
    createdAt: string;
    client?: {
      companyName: string;
    };
    createdBy: {
      email: string;
    };
  };
}

export default function SharedReportPage() {
  const params = useParams();
  const token = params.token as string;
  
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [passwordRequired, setPasswordRequired] = useState(false);
  const [password, setPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);

  useEffect(() => {
    loadReport();
  }, [token]);

  const loadReport = async (providedPassword?: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const url = `/api/share/${token}${providedPassword ? `?password=${encodeURIComponent(providedPassword)}` : ''}`;
      const response = await fetch(url);
      
      if (response.status === 401) {
        const data = await response.json();
        if (data.passwordRequired) {
          setPasswordRequired(true);
          setLoading(false);
          return;
        }
        setError('Invalid password');
        setLoading(false);
        return;
      }
      
      if (response.status === 404) {
        setError('Share link not found');
        setLoading(false);
        return;
      }
      
      if (response.status === 410) {
        setError('This share link has expired or is no longer active');
        setLoading(false);
        return;
      }
      
      if (!response.ok) {
        throw new Error('Failed to load report');
      }
      
      const data = await response.json();
      setReportData(data);
      setPasswordRequired(false);
    } catch (err) {
      setError('Failed to load report. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) return;
    
    setPasswordLoading(true);
    await loadReport(password);
    setPasswordLoading(false);
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading report...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Error</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <Button onClick={() => window.location.reload()} variant="outline">
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (passwordRequired) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="rounded-full bg-blue-100 p-3 w-12 h-12 mx-auto mb-4">
              <Lock className="h-6 w-6 text-blue-600" />
            </div>
            <CardTitle>Password Protected</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 text-center mb-6">
              This report is password protected. Please enter the password to view it.
            </p>
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div>
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password..."
                  className="mt-1"
                />
              </div>
              <Button 
                type="submit" 
                className="w-full"
                disabled={passwordLoading || !password.trim()}
              >
                {passwordLoading ? 'Verifying...' : 'Access Report'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!reportData) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b print:hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center space-x-3">
              <FileText className="h-6 w-6 text-blue-600" />
              <h1 className="text-xl font-semibold text-gray-900">
                Shared Report
              </h1>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="outline" onClick={handlePrint}>
                <Download className="h-4 w-4 mr-2" />
                Print
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Report Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Report Header */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl">{reportData.report.title}</CardTitle>
                <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
                  {reportData.report.client && (
                    <span>Client: {reportData.report.client.companyName}</span>
                  )}
                  <span>
                    Created: {format(new Date(reportData.report.createdAt), 'MMM d, yyyy')}
                  </span>
                  <span>
                    Views: {reportData.shareLink.accessCount}
                  </span>
                </div>
              </div>
              <Badge variant="secondary">
                <Eye className="h-3 w-3 mr-1" />
                Shared View
              </Badge>
            </div>
          </CardHeader>
        </Card>

        {/* Professional Report Display */}
        {reportData.report.data && reportData.report.data.documents && (
          <SharedReportView reportData={reportData.report.data} />
        )}

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-gray-500 print:hidden">
          <p>
            Powered by <span className="font-medium text-blue-600">Benee-Fit CMS</span>
          </p>
          <p className="mt-1">
            This report was shared securely via encrypted link
          </p>
        </div>
      </div>
    </div>
  );
}