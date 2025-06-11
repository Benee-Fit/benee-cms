'use client';

import { useState, useCallback, type DragEvent, type ChangeEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '../../components/header';
import { Button } from '@repo/design-system/components/ui/button';
import { Card, CardContent } from '@repo/design-system/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@repo/design-system/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@repo/design-system/components/ui/tabs';
import { Info, Upload, AlertCircle, FileText, UploadCloud } from 'lucide-react';
import QuoteQuestionnaireModal from './components/quote-questionnaire/QuoteQuestionnaireModal';
import type { QuoteQuestionnaireData } from './components/quote-questionnaire/types';

interface FileWithPreview extends File {
  preview?: string;
  category?: 'Current' | 'Renegotiated' | 'Alternative';
}

export default function DocumentParserPage() {
  const router = useRouter();
  const [files, setFiles] = useState<FileWithPreview[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<'Current' | 'Renegotiated' | 'Alternative'>('Current');
  const [dragActive, setDragActive] = useState(false);
  
  // Questionnaire modal state
  const [showQuestionnaire, setShowQuestionnaire] = useState(false);
  const [isProcessingComplete, setIsProcessingComplete] = useState(false);
  const [processingError, setProcessingError] = useState<string | null>(null);
  const [questionnaireData, setQuestionnaireData] = useState<QuoteQuestionnaireData | null>(null);
  const [processedResults, setProcessedResults] = useState<Record<string, unknown>[]>([]);

  // Handle drag events
  const handleDrag = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  // Handle drop event
  const handleDrop = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const newFiles = Array.from(e.dataTransfer.files).map(file => {
        const fileWithCategory = file as FileWithPreview;
        fileWithCategory.category = activeCategory;
        return fileWithCategory;
      });
      
      // Add only PDF files
      const pdfFiles = newFiles.filter(file => 
        file.type === 'application/pdf'
      );
      
      if (pdfFiles.length !== newFiles.length) {
        setError('Only PDF files are allowed.');
      }
      
      if (pdfFiles.length > 0) {
        setFiles(prev => [...prev, ...pdfFiles]);
      }
    }
  }, [activeCategory]);

  // Handle file input change
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files).map(file => {
        const fileWithCategory = file as FileWithPreview;
        fileWithCategory.category = activeCategory;
        return fileWithCategory;
      });
      
      setFiles(prev => [...prev, ...newFiles]);
    }
  };

  // Remove a file from the list
  const handleRemoveFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  // Process a single document file and return the structured result
  const processDocumentFile = async (file: FileWithPreview): Promise<Record<string, unknown>> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('category', file.category || 'Current');
    
    // Create an AbortController to handle fetch timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 300000); // 5 minute timeout (Gemini API can take a while)
    
    try {
      const response = await fetch('/api/process-document', {
        method: 'POST',
        body: formData,
        signal: controller.signal,
        headers: {
          'Accept': 'application/json'
        },
        cache: 'no-store'
      });
      
      // Clear the timeout as the request completed
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        let errorMessage = 'Failed to process document';
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch (_) {
          // Handle case where response isn't valid JSON
          errorMessage = `Error status ${response.status}: ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }
      
      const result = await response.json();
      return {
        ...result,
        originalFileName: file.name,
        category: file.category,
      };
    } catch (fetchError: unknown) {
      if (fetchError instanceof DOMException && fetchError.name === 'AbortError') {
        throw new Error(`Processing timeout for file ${file.name}. The request took too long.`);
      }
      throw fetchError; // Re-throw to be handled in the outer catch
    }
  };
  
  // Main process handler for all files
  const handleProcessFiles = async () => {
    if (files.length === 0) {
      setError('Please upload at least one PDF document to process.');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    setIsProcessingComplete(false);
    setProcessingError(null);
    
    // Open questionnaire modal immediately when processing starts
    setShowQuestionnaire(true);
    
    try {
      const results: Record<string, unknown>[] = [];
      
      // Process each file sequentially to avoid overloading the server
      for (const file of files) {
        const processedResult = await processDocumentFile(file);
        
        // Explicitly normalize the document structure if needed
        const normalizedResult = {
          ...processedResult,
          originalFileName: file.name,
          category: file.category,
          // Ensure metadata exists
          metadata: processedResult.metadata || {
            documentType: 'Unknown',
            clientName: 'Unknown',
            carrierName: 'Unknown Carrier',
            effectiveDate: new Date().toISOString().split('T')[0],
            quoteDate: new Date().toISOString().split('T')[0],
            fileName: file.name,
            fileCategory: file.category || 'Current'
          },
          // Ensure coverages exists and is an array
          coverages: Array.isArray(processedResult.coverages) && processedResult.coverages.length > 0 
            ? processedResult.coverages 
            : [{
                coverageType: 'Basic Life',
                carrierName: (processedResult.metadata && typeof processedResult.metadata === 'object' && 'carrierName' in processedResult.metadata) ? String(processedResult.metadata.carrierName) : 'Unknown Carrier',
                planOptionName: 'Default Plan',
                premium: 0,
                monthlyPremium: 0,
                unitRate: 0,
                unitRateBasis: 'per $1,000',
                volume: 0,
                lives: 0,
                benefitDetails: {
                  note: 'Coverage details could not be extracted from document'
                }
              }]
        };
        
        results.push(normalizedResult);
      }
      
      // Store processed results temporarily
      setProcessedResults(results);
      setIsProcessingComplete(true);
      
      // If questionnaire is already complete, proceed immediately
      if (questionnaireData) {
        proceedToResults(results, questionnaireData);
      }
      
    } catch (err: unknown) {
      // Log error safely without using console directly in production
      const errorMsg = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(errorMsg || 'An error occurred while processing the documents.');
      setProcessingError(errorMsg);
      setIsProcessingComplete(true);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle questionnaire completion
  const handleQuestionnaireComplete = (data: QuoteQuestionnaireData) => {
    setQuestionnaireData(data);
    setShowQuestionnaire(false);
    
    // If processing is also complete, proceed to results
    if (isProcessingComplete) {
      proceedToResults(processedResults, data);
    }
  };

  // Handle questionnaire modal close
  const handleQuestionnaireClose = () => {
    setShowQuestionnaire(false);
    // Reset processing state if user closes modal before completion
    if (!isProcessingComplete) {
      setIsLoading(false);
    }
  };

  // Proceed to plan selection page with combined data
  const proceedToResults = (results: Record<string, unknown>[], questionnaire: QuoteQuestionnaireData) => {
    // Combine processed documents with questionnaire data
    const combinedData = {
      processedDocuments: results,
      questionnaireData: questionnaire
    };
    
    // Store combined results in localStorage for the plan selection page
    localStorage.setItem('parsedBenefitsDocuments', JSON.stringify(results));
    localStorage.setItem('quoteQuestionnaireResults', JSON.stringify(questionnaire));
    
    // Navigate to plan selection page instead of results
    router.push('/quote-tool/plan-selection');
  };

  return (
    <>
      <Header pages={["Quote Tool"]} page="Document Parser">
        <h2 className="text-xl font-semibold">Document Parser</h2>
      </Header>
      <div className="mb-6">
        <h2 className="text-2xl font-bold">Upload Insurance Documents</h2>
        <p className="text-muted-foreground">
          Upload insurance quote PDFs for AI-powered parsing and comparison
        </p>
      </div>
      
      {/* Document Category Tabs */}
      <Tabs 
        defaultValue="Current" 
        className="mb-6"
        onValueChange={(value) => setActiveCategory(value as 'Current' | 'Renegotiated' | 'Alternative')}
      >
        <TabsList>
          <TabsTrigger value="Current">Current Plan</TabsTrigger>
          <TabsTrigger value="Renegotiated">Renegotiated</TabsTrigger>
          <TabsTrigger value="Alternative">Alternative</TabsTrigger>
        </TabsList>
        
        <TabsContent value="Current" className="mt-2">
          <Alert>
            <Info className="h-4 w-4" />
            <AlertTitle>Current Plan Documents</AlertTitle>
            <AlertDescription>
              Upload existing plan documents for baseline comparison.
            </AlertDescription>
          </Alert>
        </TabsContent>
        
        <TabsContent value="Renegotiated" className="mt-2">
          <Alert>
            <Info className="h-4 w-4" />
            <AlertTitle>Renegotiated Plan Documents</AlertTitle>
            <AlertDescription>
              Upload documents for renegotiated plans to compare against current plans.
            </AlertDescription>
          </Alert>
        </TabsContent>
        
        <TabsContent value="Alternative" className="mt-2">
          <Alert>
            <Info className="h-4 w-4" />
            <AlertTitle>Alternative Quote Documents</AlertTitle>
            <AlertDescription>
              Upload alternative carrier quotes for competitive analysis.
            </AlertDescription>
          </Alert>
        </TabsContent>
      </Tabs>
      
      {/* Error Display */}
      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      {/* File Upload Area */}
      <div className="mb-6">
        <div 
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-lg p-10 text-center transition-colors ${dragActive ? 'border-primary bg-muted/50' : 'border-muted-foreground/25 hover:border-muted-foreground/50'}`}
        >
          <div className="flex flex-col items-center justify-center space-y-4">
            <div className="rounded-full bg-primary/10 p-4">
              <UploadCloud className="h-8 w-8 text-primary" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-medium">
                Drag & drop files or click to browse
              </h3>
              <p className="text-sm text-muted-foreground">
                Upload PDF files for parsing ({activeCategory} category)
              </p>
            </div>
            <div>
              <Button 
                variant="outline" 
                type="button" 
                onClick={() => document.getElementById('file-upload')?.click()}
              >
                <Upload className="mr-2 h-4 w-4" />
                Select Files
              </Button>
              <input
                id="file-upload"
                type="file"
                multiple
                accept=".pdf"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>
          </div>
        </div>
      </div>
      
      {/* File List */}
      {files.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-medium mb-3">
            {files.length} file{files.length !== 1 ? 's' : ''} selected
          </h3>
          <div className="space-y-2">
            {files.map((file, index) => (
              <Card key={index} className="overflow-hidden">
                <CardContent className="p-3 flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="bg-muted rounded-md p-2 mr-3">
                      <FileText className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium truncate max-w-[300px]">
                        {file.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {(file.size / 1024).toFixed(1)} KB • 
                        <span className="ml-2 px-2 py-0.5 rounded-full bg-muted text-xs">
                          {file.category}
                        </span>
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveFile(index)}
                  >
                    Remove
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
      
          {/* Process Button */}
          <div className="flex justify-end mt-6">
            <Button 
              onClick={handleProcessFiles}
              disabled={files.length === 0 || isLoading}
              className="w-full sm:w-auto"
              size="lg"
            >
              {isLoading ? 'Processing...' : 'Process Documents'}
            </Button>
          </div>

      {/* Quote Questionnaire Modal */}
      <QuoteQuestionnaireModal
        isOpen={showQuestionnaire}
        onClose={handleQuestionnaireClose}
        onComplete={handleQuestionnaireComplete}
        isProcessingComplete={isProcessingComplete}
        processingError={processingError}
      />
    </>
  );
}
