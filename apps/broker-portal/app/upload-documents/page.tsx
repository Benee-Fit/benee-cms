'use client';

import { PageLayout } from '../page-layout';
import { Alert, AlertDescription } from '@repo/design-system/components/ui/alert';
import { InfoIcon } from 'lucide-react';
import { Button } from '@repo/design-system/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@repo/design-system/components/ui/card';
import { Upload } from 'lucide-react';

export default function UploadDocumentsPage() {
  return (
    <PageLayout>
      <div className="container mx-auto pt-12 px-6 pb-6">
        <h1 className="text-3xl font-bold mb-6">Upload Documents</h1>
        
        <Alert className="mb-6">
          <InfoIcon className="h-4 w-4" />
          <AlertDescription>
            Upload functionality will be available soon. This feature will allow you to upload and manage documents related to your clients.
          </AlertDescription>
        </Alert>
        
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-xl">Document Upload</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center">
              <Upload className="mx-auto h-12 w-12 text-gray-400" />
              <div className="mt-4 text-sm text-gray-600">
                <label htmlFor="file-upload" className="relative cursor-not-allowed rounded-md bg-white font-medium text-primary focus-within:outline-none focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2">
                  <Button variant="outline" disabled className="mt-2">
                    Select files to upload
                  </Button>
                </label>
                <p className="text-xs text-gray-500 mt-1">
                  Coming soon: Upload PDF, DOCX, XLSX files up to 10MB
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageLayout>
  );
}
