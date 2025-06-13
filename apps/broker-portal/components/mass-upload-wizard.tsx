'use client';

import React, { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@repo/design-system/components/ui/dialog';
import { Button } from '@repo/design-system/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@repo/design-system/components/ui/card';
import { Progress } from '@repo/design-system/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@repo/design-system/components/ui/alert';
import { Badge } from '@repo/design-system/components/ui/badge';
import { Separator } from '@repo/design-system/components/ui/separator';
import { 
  Upload, 
  FileSpreadsheet, 
  Archive, 
  CheckCircle, 
  AlertTriangle, 
  X,
  Eye,
  Download
} from 'lucide-react';

// Document types from HR portal
const DOCUMENT_TYPES = [
  'Benefits Booklet',
  'Claim',
  'Compliance Notice',
  'Contract',
  'Employee Census',
  'Form',
  'Invoice',
  'Renewal',
  'Policy',
  'Other'
];

interface CSVClient {
  companyName: string;
  policyNumber: string;
  planManagementFee: number;
  hasBrokerSplit: boolean;
  brokerSplit?: number;
}

interface ProcessingResult {
  success: CSVClient[];
  duplicates: CSVClient[];
  errors: { row: number; error: string; data: any }[];
}

interface DocumentProcessingResult {
  fileName: string;
  status: 'processing' | 'success' | 'error' | 'unmatched';
  clientId?: string;
  documentType?: string;
  extractedData?: {
    carrier?: string;
    renewalDate?: string;
    premium?: number;
    headcount?: number;
  };
  error?: string;
}

interface MassUploadWizardProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function MassUploadWizard({ open, onClose, onSuccess }: MassUploadWizardProps) {
  const [step, setStep] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [zipFile, setZipFile] = useState<File | null>(null);
  const [csvData, setCsvData] = useState<CSVClient[]>([]);
  const [processingResults, setProcessingResults] = useState<ProcessingResult | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [documentProgress, setDocumentProgress] = useState(0);
  const [documentResults, setDocumentResults] = useState<DocumentProcessingResult[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  
  const csvFileRef = useRef<HTMLInputElement>(null);
  const zipFileRef = useRef<HTMLInputElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const handleClose = () => {
    // Cancel any ongoing processing
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    // Reset all state
    setStep(1);
    setIsProcessing(false);
    setCsvFile(null);
    setZipFile(null);
    setCsvData([]);
    setProcessingResults(null);
    setUploadProgress(0);
    setDocumentProgress(0);
    setDocumentResults([]);
    setError(null);
    setShowPreview(false);
    
    onClose();
  };

  const handleCsvUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setCsvFile(file);
    setError(null);

    try {
      const text = await file.text();
      const lines = text.trim().split('\n');
      
      if (lines.length < 2) {
        setError('CSV file must contain at least a header row and one data row');
        return;
      }

      const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim());
      const expectedHeaders = ['companyName', 'policyNumber', 'planManagementFee', 'hasBrokerSplit', 'brokerSplit'];
      
      // Validate headers
      const missingHeaders = expectedHeaders.filter(h => !headers.includes(h));
      if (missingHeaders.length > 0) {
        setError(`Missing required columns: ${missingHeaders.join(', ')}`);
        return;
      }

      // Parse data
      const data: CSVClient[] = [];
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.replace(/"/g, '').trim());
        const row: any = {};
        
        headers.forEach((header, index) => {
          row[header] = values[index] || '';
        });

        data.push({
          companyName: row.companyName,
          policyNumber: row.policyNumber,
          planManagementFee: parseFloat(row.planManagementFee) || 0,
          hasBrokerSplit: row.hasBrokerSplit?.toLowerCase() === 'yes' || row.hasBrokerSplit?.toLowerCase() === 'true',
          brokerSplit: row.brokerSplit ? parseFloat(row.brokerSplit) : undefined,
        });
      }

      setCsvData(data);
    } catch (err) {
      setError('Failed to parse CSV file. Please check the format.');
    }
  };

  const handleZipUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/zip' && !file.name.endsWith('.zip')) {
      setError('Please select a valid ZIP file');
      return;
    }

    setZipFile(file);
    setError(null);
  };

  const processCSVData = async () => {
    if (!csvData.length) return;

    setIsProcessing(true);
    setError(null);

    try {
      const response = await fetch('/api/clients/mass-upload/csv', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clients: csvData }),
      });

      if (!response.ok) {
        throw new Error('Failed to process CSV data');
      }

      const results = await response.json();
      setProcessingResults(results);
      setStep(2);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process CSV data');
    } finally {
      setIsProcessing(false);
    }
  };

  const processDocuments = async () => {
    if (!zipFile || !processingResults) return;

    setIsProcessing(true);
    setError(null);
    setDocumentResults([]);
    setUploadProgress(0);
    setDocumentProgress(0);

    try {
      abortControllerRef.current = new AbortController();
      
      const formData = new FormData();
      formData.append('zipFile', zipFile);
      formData.append('clientData', JSON.stringify(processingResults.success));

      const response = await fetch('/api/clients/mass-upload/documents', {
        method: 'POST',
        body: formData,
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        throw new Error('Failed to upload documents');
      }

      // Handle streaming response for progress updates
      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('Failed to read response stream');
      }

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.trim()) {
            try {
              const update = JSON.parse(line);
              
              if (update.type === 'upload_progress') {
                setUploadProgress(update.progress);
              } else if (update.type === 'document_progress') {
                setDocumentProgress(update.progress);
              } else if (update.type === 'document_result') {
                setDocumentResults(prev => [...prev, update.result]);
              } else if (update.type === 'error') {
                throw new Error(update.message || 'Processing failed');
              } else if (update.type === 'complete') {
                // Check if there are any errors in the results
                const results = update.results || [];
                const hasErrors = results.some((r: any) => r.status === 'error');
                
                if (hasErrors) {
                  // Show results but stay on step 2 to let user see errors
                  setDocumentResults(results);
                  setError('Some documents failed to process. Please review the errors above.');
                } else {
                  // Processing completed successfully
                  setStep(3);
                  onSuccess();
                }
              }
            } catch (err) {
              // Re-throw error messages from the stream
              if (err instanceof Error && err.message !== 'Failed to parse progress update:') {
                throw err;
              }
              console.warn('Failed to parse progress update:', line);
            }
          }
        }
      }

      // Don't automatically advance - wait for 'complete' message from stream
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        setError('Upload cancelled');
      } else {
        setError(err instanceof Error ? err.message : 'Failed to process documents');
      }
      // Don't advance to step 3 if there's an error
    } finally {
      setIsProcessing(false);
      abortControllerRef.current = null;
    }
  };

  const cancelProcessing = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  };

  const getStepTitle = () => {
    switch (step) {
      case 1: return 'Upload Client Data (CSV)';
      case 2: return 'Upload Documents (ZIP)';
      case 3: return 'Processing Results';
      default: return 'Mass Upload';
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Mass Upload Clients & Documents - Step {step} of 3</DialogTitle>
        </DialogHeader>

        {/* Step 1: CSV Upload */}
        {step === 1 && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-2">Step 1: Upload Client Data</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Upload a CSV file with client information. Required columns: companyName, policyNumber, planManagementFee, hasBrokerSplit, brokerSplit
              </p>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileSpreadsheet className="h-5 w-5" />
                  CSV File Upload
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div 
                    className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center cursor-pointer hover:border-muted-foreground/50 transition-colors"
                    onClick={() => csvFileRef.current?.click()}
                  >
                    <FileSpreadsheet className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-sm text-muted-foreground">
                      {csvFile ? csvFile.name : 'Click to select CSV file or drag and drop'}
                    </p>
                    <input
                      ref={csvFileRef}
                      type="file"
                      accept=".csv,.xlsx,.xls"
                      onChange={handleCsvUpload}
                      className="hidden"
                    />
                  </div>

                  {csvData.length > 0 && (
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-medium">
                          Parsed {csvData.length} client records
                        </p>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setShowPreview(!showPreview)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          {showPreview ? 'Hide' : 'Preview'}
                        </Button>
                      </div>
                      
                      {showPreview && (
                        <div className="border rounded-lg p-4 max-h-64 overflow-y-auto">
                          <div className="space-y-2">
                            {csvData.slice(0, 5).map((client, index) => (
                              <div key={index} className="text-xs bg-muted p-2 rounded">
                                <strong>{client.companyName}</strong> - {client.policyNumber} - 
                                ${client.planManagementFee} - Split: {client.hasBrokerSplit ? 'Yes' : 'No'}
                                {client.brokerSplit && ` (${client.brokerSplit}%)`}
                              </div>
                            ))}
                            {csvData.length > 5 && (
                              <p className="text-xs text-muted-foreground">
                                ... and {csvData.length - 5} more records
                              </p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {error && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="flex justify-between">
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button 
                onClick={processCSVData}
                disabled={!csvData.length || isProcessing}
              >
                {isProcessing ? 'Processing...' : 'Next: Upload Documents'}
              </Button>
            </div>
          </div>
        )}

        {/* Step 2: ZIP Upload */}
        {step === 2 && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-2">Step 2: Upload Document Archive</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Upload a ZIP file containing PDF documents. Files will be processed by AI to extract information and match to clients.
              </p>
            </div>

            {processingResults && (
              <div className="grid grid-cols-3 gap-4 mb-6">
                <Card>
                  <CardContent className="p-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-green-600">{processingResults.success.length}</p>
                      <p className="text-sm text-muted-foreground">Clients Ready</p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-orange-600">{processingResults.duplicates.length}</p>
                      <p className="text-sm text-muted-foreground">Duplicates Found</p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-red-600">{processingResults.errors.length}</p>
                      <p className="text-sm text-muted-foreground">Errors</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Archive className="h-5 w-5" />
                  ZIP File Upload
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div 
                    className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center cursor-pointer hover:border-muted-foreground/50 transition-colors"
                    onClick={() => zipFileRef.current?.click()}
                  >
                    <Archive className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-sm text-muted-foreground">
                      {zipFile ? zipFile.name : 'Click to select ZIP file or drag and drop'}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Maximum file size: 20GB
                    </p>
                    <input
                      ref={zipFileRef}
                      type="file"
                      accept=".zip"
                      onChange={handleZipUpload}
                      className="hidden"
                    />
                  </div>

                  {zipFile && (
                    <div className="bg-muted p-4 rounded-lg">
                      <p className="text-sm font-medium">Selected: {zipFile.name}</p>
                      <p className="text-xs text-muted-foreground">
                        Size: {(zipFile.size / (1024 * 1024)).toFixed(2)} MB
                      </p>
                    </div>
                  )}

                  {isProcessing && (
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm font-medium">Upload Progress</span>
                          <span className="text-sm text-muted-foreground">{uploadProgress}%</span>
                        </div>
                        <Progress value={uploadProgress} className="w-full" />
                      </div>
                      
                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm font-medium">Document Processing</span>
                          <span className="text-sm text-muted-foreground">{documentProgress}%</span>
                        </div>
                        <Progress value={documentProgress} className="w-full" />
                      </div>

                      {documentResults.length > 0 && (
                        <div className="space-y-2">
                          <div className="max-h-32 overflow-y-auto space-y-1">
                            {documentResults.slice(-5).map((result, index) => (
                              <div key={index} className="flex items-center gap-2 text-xs">
                                {result.status === 'success' && <CheckCircle className="h-3 w-3 text-green-600" />}
                                {result.status === 'error' && <X className="h-3 w-3 text-red-600" />}
                                {result.status === 'unmatched' && <AlertTriangle className="h-3 w-3 text-orange-600" />}
                                {result.status === 'processing' && <div className="h-3 w-3 border border-blue-600 border-t-transparent rounded-full animate-spin" />}
                                <span className="truncate flex-1">{result.fileName}</span>
                                {result.status === 'error' && (
                                  <span className="text-xs text-red-600 truncate max-w-[200px]">{result.error}</span>
                                )}
                              </div>
                            ))}
                          </div>
                          
                          {/* Summary of results */}
                          {documentProgress === 100 && (
                            <div className="mt-2 pt-2 border-t text-xs space-y-1">
                              <div className="flex justify-between">
                                <span>Success:</span>
                                <span className="text-green-600">{documentResults.filter(r => r.status === 'success').length}</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Unmatched:</span>
                                <span className="text-orange-600">{documentResults.filter(r => r.status === 'unmatched').length}</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Errors:</span>
                                <span className="text-red-600">{documentResults.filter(r => r.status === 'error').length}</span>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {error && (
              <Alert variant="destructive" className="border-red-600">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Error Processing Documents</AlertTitle>
                <AlertDescription className="mt-2">
                  <div className="space-y-2">
                    <p>{error}</p>
                    <p className="text-sm">Please check your files and try again. Make sure:</p>
                    <ul className="text-sm list-disc list-inside ml-2">
                      <li>The ZIP file contains valid PDF documents</li>
                      <li>PDFs are not password protected</li>
                      <li>Files are not corrupted</li>
                    </ul>
                  </div>
                </AlertDescription>
              </Alert>
            )}

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(1)} disabled={isProcessing}>
                Back
              </Button>
              <div className="space-x-2">
                {isProcessing && (
                  <Button variant="outline" onClick={cancelProcessing}>
                    Cancel Upload
                  </Button>
                )}
                {error && documentResults.length > 0 && documentProgress === 100 && (
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setStep(3);
                      onSuccess();
                    }}
                  >
                    View Results Anyway
                  </Button>
                )}
                <Button 
                  onClick={processDocuments}
                  disabled={!zipFile || isProcessing}
                >
                  {isProcessing ? 'Processing...' : 'Start Processing'}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Results */}
        {step === 3 && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-2">Processing Complete</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Review the results of the mass upload and document processing.
              </p>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-600">
                      {documentResults.filter(r => r.status === 'success').length}
                    </p>
                    <p className="text-sm text-muted-foreground">Processed</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-orange-600">
                      {documentResults.filter(r => r.status === 'unmatched').length}
                    </p>
                    <p className="text-sm text-muted-foreground">Unmatched</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-red-600">
                      {documentResults.filter(r => r.status === 'error').length}
                    </p>
                    <p className="text-sm text-muted-foreground">Errors</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-blue-600">
                      {documentResults.length}
                    </p>
                    <p className="text-sm text-muted-foreground">Total Files</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Results Details */}
            <div className="space-y-4">
              {processingResults?.duplicates && processingResults.duplicates.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-orange-600">Duplicate Policy Numbers</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {processingResults.duplicates.map((client, index) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-orange-50 rounded">
                          <span className="text-sm">{client.companyName} - {client.policyNumber}</span>
                          <Badge variant="outline">Duplicate</Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {documentResults.filter(r => r.status === 'unmatched').length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-orange-600">Unmatched Documents</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {documentResults.filter(r => r.status === 'unmatched').map((result, index) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-orange-50 rounded">
                          <span className="text-sm">{result.fileName}</span>
                          <Badge variant="outline">Review Required</Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {documentResults.filter(r => r.status === 'error').length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-red-600">Processing Errors</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {documentResults.filter(r => r.status === 'error').map((result, index) => (
                        <div key={index} className="space-y-1 p-2 bg-red-50 rounded">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">{result.fileName}</span>
                            <Badge variant="destructive">Error</Badge>
                          </div>
                          <p className="text-xs text-muted-foreground">{result.error}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            <div className="flex justify-end">
              <Button onClick={handleClose}>
                Complete
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}