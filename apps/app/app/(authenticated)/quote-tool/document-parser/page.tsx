'use client';

import { useState, useCallback, useEffect, type DragEvent, type ChangeEvent } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Header } from '../../components/header';
import { Button } from '@repo/design-system/components/ui/button';
import { Card, CardContent } from '@repo/design-system/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@repo/design-system/components/ui/alert';
import { Badge } from '@repo/design-system/components/ui/badge';
import { Info, Upload, AlertCircle, FileText, UploadCloud, CheckCircle2, Plus } from 'lucide-react';
import QuoteQuestionnaireModal from './components/quote-questionnaire/QuoteQuestionnaireModal';
import EnhancedDocumentTypeSelector from './components/EnhancedDocumentTypeSelector';
import ProcessingStatus from './components/ProcessingStatus';
import BatchProcessingStatus from './components/BatchProcessingStatus';
import type { QuoteQuestionnaireData } from './components/quote-questionnaire/types';

interface FileWithPreview extends File {
  preview?: string;
  category?: 'Current' | 'Renegotiated' | 'Alternative';
}

interface ProcessingStage {
  id: string;
  name: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  startTime?: string;
  endTime?: string;
  progress?: number;
  details?: string;
}

export default function DocumentParserPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isAddingMoreFromURL = searchParams?.get('mode') === 'add-more';
  const isAddingMoreFromStorage = typeof window !== 'undefined' && localStorage.getItem('uploadMode') === 'add-more';
  const isAddingMore = isAddingMoreFromURL || isAddingMoreFromStorage;
  
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
  const [processingStages, setProcessingStages] = useState<ProcessingStage[]>([]);
  const [currentProcessingFile, setCurrentProcessingFile] = useState<string | null>(null);
  const [showBatchUpload, setShowBatchUpload] = useState(false);
  const [hasExistingSession, setHasExistingSession] = useState(false);
  
  // Batch processing state
  const [processingIndex, setProcessingIndex] = useState(0);
  const [completedFiles, setCompletedFiles] = useState<Array<{file: FileWithPreview; status: 'completed'; result: Record<string, unknown>}>>([]);
  const [failedFiles, setFailedFiles] = useState<Array<{file: FileWithPreview; status: 'failed'; error: string}>>([]);
  const [estimatedTimeRemaining, setEstimatedTimeRemaining] = useState<number | null>(null);

  // Check for existing data on mount and reset questionnaire if no parsed documents
  useEffect(() => {
    const parsedDocuments = localStorage.getItem('parsedBenefitsDocuments');
    const questionnaireResults = localStorage.getItem('quoteQuestionnaireResults');
    const questionnaireData = localStorage.getItem('quoteQuestionnaireData');
    
    // Set flag for existing session data
    setHasExistingSession(!!parsedDocuments || !!questionnaireResults || !!questionnaireData);
    
    if (isAddingMore) {
      // When adding more documents, load existing questionnaire data
      if (questionnaireResults) {
        try {
          const parsedQuestionnaire = JSON.parse(questionnaireResults);
          setQuestionnaireData(parsedQuestionnaire);
        } catch (error) {
          console.error('Error parsing existing questionnaire data:', error);
        }
      }
    } else {
      // If no parsed documents exist, clear the questionnaire data
      if (!parsedDocuments) {
        if (questionnaireResults) {
          localStorage.removeItem('quoteQuestionnaireResults');
          localStorage.removeItem('quoteQuestionnaireData'); // Also clear in-progress questionnaire data
        }
        setQuestionnaireData(null);
        setProcessedResults([]);
        setIsProcessingComplete(false);
        setProcessingError(null);
      }
    }
  }, [isAddingMore]);

  // Reset questionnaire and processed data when starting fresh
  const resetSessionData = useCallback(() => {
    localStorage.removeItem('parsedBenefitsDocuments');
    localStorage.removeItem('quoteQuestionnaireResults');
    localStorage.removeItem('quoteQuestionnaireData');
    localStorage.removeItem('uploadMode');
    setQuestionnaireData(null);
    setProcessedResults([]);
    setIsProcessingComplete(false);
    setProcessingError(null);
    setShowQuestionnaire(false);
    setHasExistingSession(false);
  }, []);

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

  // Initialize processing stages for a file
  const initializeProcessingStages = (fileName: string): ProcessingStage[] => [
    {
      id: 'upload',
      name: 'File Upload',
      description: 'Uploading document to server',
      status: 'pending'
    },
    {
      id: 'extraction',
      name: 'Content Extraction',
      description: 'Extracting text and data from PDF',
      status: 'pending'
    },
    {
      id: 'parsing',
      name: 'AI Parsing',
      description: 'Analyzing document structure and extracting benefits data',
      status: 'pending'
    },
    {
      id: 'saving',
      name: 'Saving Results',
      description: 'Saving parsed data and generating analysis',
      status: 'pending'
    }
  ];

  // Update processing stage status
  const updateProcessingStage = (stageId: string, updates: Partial<ProcessingStage>) => {
    setProcessingStages(prev => 
      prev.map(stage => 
        stage.id === stageId 
          ? { ...stage, ...updates, startTime: updates.status === 'in_progress' ? new Date().toISOString() : stage.startTime, endTime: updates.status === 'completed' || updates.status === 'failed' ? new Date().toISOString() : stage.endTime }
          : stage
      )
    );
  };

  // Process a single document file and return the structured result
  const processDocumentFile = async (file: FileWithPreview): Promise<Record<string, unknown>> => {
    setCurrentProcessingFile(file.name);
    const stages = initializeProcessingStages(file.name);
    setProcessingStages(stages);

    try {
      // Stage 1: Upload
      updateProcessingStage('upload', { status: 'in_progress', details: 'Preparing file for upload...' });
      
      const formData = new FormData();
      formData.append('file', file);
      formData.append('category', file.category || 'Current');
      
      updateProcessingStage('upload', { status: 'completed', details: 'File uploaded successfully' });
      
      // Stage 2: Extraction
      updateProcessingStage('extraction', { status: 'in_progress', details: 'Extracting text content from PDF...' });
      
      // Create an AbortController to handle fetch timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        console.log(`[DEBUG] Timeout reached for file: ${file.name}`);
        controller.abort();
      }, 480000); // 8 minute timeout (Gemini API can take a while for complex documents)
      
      let response;
      try {
        response = await fetch('/api/process-document', {
          method: 'POST',
          body: formData,
          signal: controller.signal,
          headers: {
            'Accept': 'application/json'
          },
          cache: 'no-store'
        });
        
        // Clear the timeout as the request completed successfully
        clearTimeout(timeoutId);
      } catch (fetchError) {
        // Clear timeout on any fetch error
        clearTimeout(timeoutId);
        
        if (fetchError instanceof DOMException && fetchError.name === 'AbortError') {
          throw new Error(`Processing timeout for file ${file.name}. The request took longer than 8 minutes.`);
        }
        throw fetchError;
      }
      
      if (!response.ok) {
        let errorMessage = 'Failed to process document';
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch (_) {
          // Handle case where response isn't valid JSON
          errorMessage = `Error status ${response.status}: ${response.statusText}`;
        }
        updateProcessingStage('extraction', { status: 'failed', details: errorMessage });
        throw new Error(errorMessage);
      }
      
      updateProcessingStage('extraction', { status: 'completed', details: 'Text extraction completed' });
      
      // Stage 3: Parsing
      updateProcessingStage('parsing', { status: 'in_progress', details: 'AI analyzing document structure...' });
      
      const result = await response.json();
      
      updateProcessingStage('parsing', { status: 'completed', details: 'Benefits data extracted successfully' });
      
      // Stage 4: Saving
      updateProcessingStage('saving', { status: 'in_progress', details: 'Saving parsed results...' });
      
      const processedResult = {
        ...result,
        originalFileName: file.name,
        category: file.category,
      };
      
      updateProcessingStage('saving', { status: 'completed', details: 'Results saved successfully' });
      
      return processedResult;
    } catch (fetchError: unknown) {
      let errorMessage = 'Unknown error occurred';
      
      if (fetchError instanceof DOMException && fetchError.name === 'AbortError') {
        errorMessage = `Processing timeout for file ${file.name}. The request took longer than 8 minutes.`;
      } else if (fetchError instanceof Error) {
        errorMessage = fetchError.message;
      }
      
      console.error(`[DEBUG] Processing error for ${file.name}:`, errorMessage);
      
      // Mark current stage as failed
      const currentStage = processingStages.find(stage => stage.status === 'in_progress');
      if (currentStage) {
        updateProcessingStage(currentStage.id, { status: 'failed', details: errorMessage });
      }
      
      throw new Error(errorMessage); // Throw a new Error with the message for consistent handling
    }
  };
  

  // Calculate estimated time remaining (4-8 minutes per file)
  const calculateTimeRemaining = useCallback((currentIndex: number, totalFiles: number, avgTimePerFile: number = 360) => {
    const remainingFiles = totalFiles - currentIndex;
    return remainingFiles * avgTimePerFile; // seconds (6 minutes average)
  }, []);

  // Normalize processed result
  const normalizeResult = useCallback((processedResult: Record<string, unknown>, file: FileWithPreview) => {
    // Check if we have processedData structure (from API response)
    const hasProcessedData = processedResult.processedData && typeof processedResult.processedData === 'object';
    const processedData = hasProcessedData ? processedResult.processedData as Record<string, unknown> : processedResult;
    
    // Extract metadata from the correct location
    const metadata = processedData.metadata || processedResult.metadata || {
      documentType: 'Unknown',
      clientName: 'Unknown',
      carrierName: 'Unknown Carrier',
      effectiveDate: new Date().toISOString().split('T')[0],
      quoteDate: new Date().toISOString().split('T')[0],
      fileName: file.name,
      fileCategory: file.category || 'Current'
    };
    
    // Extract coverages - prefer allCoverages over coverages
    let coverages = processedData.allCoverages || processedData.coverages || processedResult.coverages || [];
    
    // Ensure coverages is an array
    if (!Array.isArray(coverages) || coverages.length === 0) {
      coverages = [{
        coverageType: 'Basic Life',
        carrierName: (metadata && typeof metadata === 'object' && 'carrierName' in metadata) ? String(metadata.carrierName) : 'Unknown Carrier',
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
      }];
    }
    
    return {
      ...processedResult,
      originalFileName: file.name,
      category: file.category,
      metadata: metadata,
      coverages: coverages,
      // Include plan options if available
      planOptions: processedData.planOptions || processedResult.planOptions || []
    };
  }, []);

  // Main process handler for all files
  const handleProcessFiles = async () => {
    if (files.length === 0) {
      setError('Please upload at least one PDF document to process.');
      return;
    }
    
    // Reset any previous session data when starting new processing (but preserve questionnaire when adding more)
    if (!isAddingMore) {
      resetSessionData();
    } else {
      // When adding more, only reset processing state but keep questionnaire data
      setProcessedResults([]);
      setIsProcessingComplete(false);
      setProcessingError(null);
      setShowQuestionnaire(false);
    }
    
    setIsLoading(true);
    setError(null);
    setIsProcessingComplete(false);
    setProcessingError(null);
    setProcessingStages([]);
    setCurrentProcessingFile(null);
    
    // Reset batch processing state
    setProcessingIndex(0);
    setCompletedFiles([]);
    setFailedFiles([]);
    setEstimatedTimeRemaining(calculateTimeRemaining(0, files.length));
    
    // Open questionnaire modal immediately when processing starts (unless adding more documents)
    if (!isAddingMore) {
      setShowQuestionnaire(true);
    }
    
    try {
      const results: Record<string, unknown>[] = [];
      const startTime = Date.now();
      
      // Process each file sequentially to avoid overloading the server
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        setProcessingIndex(i);
        
        // Update time estimate based on actual performance
        if (i > 0) {
          const elapsedTime = (Date.now() - startTime) / 1000; // seconds
          const avgTimePerFile = elapsedTime / i;
          setEstimatedTimeRemaining(calculateTimeRemaining(i, files.length, avgTimePerFile));
        }
        
        console.log(`[DEBUG] Processing file ${i + 1}/${files.length}: ${file.name}`);
        
        try {
          const processedResult = await processDocumentFile(file);
          const normalizedResult = normalizeResult(processedResult, file);
          
          // Add to completed files
          setCompletedFiles(prev => [...prev, { file, status: 'completed', result: normalizedResult }]);
          results.push(normalizedResult);
        } catch (fileError) {
          const errorMessage = fileError instanceof Error ? fileError.message : 'Unknown error';
          console.error(`[DEBUG] Failed to process file ${file.name}:`, errorMessage);
          
          // Add to failed files
          setFailedFiles(prev => [...prev, { file, status: 'failed', error: errorMessage }]);
          
          // Continue processing other files instead of stopping
          continue;
        }
      }
      
      // Processing complete
      setEstimatedTimeRemaining(0);
      setProcessingIndex(files.length);
      
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
    // Don't reset loading state - let processing continue in background
    // Users can reopen the questionnaire or wait for processing to complete
  };

  // Proceed to plan selection page with combined data
  const proceedToResults = (results: Record<string, unknown>[], questionnaire: QuoteQuestionnaireData) => {
    // Combine processed documents with questionnaire data
    const combinedData = {
      processedDocuments: results,
      questionnaireData: questionnaire
    };
    
    // Store combined results in localStorage for the plan selection page
    if (isAddingMore) {
      // When adding more documents, merge with existing ones
      const existingDocuments = localStorage.getItem('parsedBenefitsDocuments');
      const existingResults = existingDocuments ? JSON.parse(existingDocuments) : [];
      const mergedResults = [...existingResults, ...results];
      localStorage.setItem('parsedBenefitsDocuments', JSON.stringify(mergedResults));
    } else {
      // For new quotes, replace existing documents
      localStorage.setItem('parsedBenefitsDocuments', JSON.stringify(results));
    }
    localStorage.setItem('quoteQuestionnaireResults', JSON.stringify(questionnaire));
    
    // Clear upload mode flag
    localStorage.removeItem('uploadMode');
    
    // Navigate to plan selection page instead of results
    router.push('/quote-tool/plan-selection');
  };

  return (
    <>
      <Header pages={["Quote Tool"]} page={isAddingMore ? "Add more documents" : "Start a quote"}>
        <h2 className="text-xl font-semibold">{isAddingMore ? "Add more documents" : "Start a quote"}</h2>
      </Header>
      <div className="mb-6">
        <h2 className="text-2xl font-bold">{isAddingMore ? "Add More Documents" : "Upload Documents"}</h2>
        <p className="text-muted-foreground">
          {isAddingMore 
            ? "Upload additional insurance quote PDFs to add to your existing comparison"
            : "Upload insurance quote PDFs for AI-powered parsing and comparison"
          }
        </p>
        {isAddingMore && (
          <div className="mt-3">
            <Badge variant="secondary" className="bg-blue-100 text-blue-800">
              <Plus className="h-3 w-3 mr-1" />
              Adding to existing quote
            </Badge>
          </div>
        )}
      </div>
      
      {/* Start Fresh Button */}
      {hasExistingSession && (
        <div className="mb-4 flex justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              resetSessionData();
              setFiles([]);
            }}
            className="flex items-center space-x-2 text-orange-600 hover:text-orange-800"
          >
            <AlertCircle className="h-4 w-4" />
            <span>Start Fresh</span>
          </Button>
        </div>
      )}
      
      {/* File Count Badge */}
      {files.length > 0 && (
        <div className="mb-4 flex justify-end">
          <Badge variant="outline" className="text-sm">
            {files.length} file{files.length !== 1 ? 's' : ''} ready
          </Badge>
        </div>
      )}
      
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
                Upload all your insurance quote PDFs for parsing and comparison
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
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-medium">
              {files.length} file{files.length !== 1 ? 's' : ''} selected
            </h3>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setFiles([])}
                className="text-red-600 hover:text-red-800"
              >
                Clear All
              </Button>
            </div>
          </div>
          
          {/* Simple file list */}
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
                        {(file.size / 1024).toFixed(1)} KB
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
      
      {/* Processing Status */}
      {isLoading && (
        <div className="mb-6" data-processing-status>
          {files.length > 1 ? (
            <BatchProcessingStatus
              files={files}
              processingIndex={processingIndex}
              completedFiles={completedFiles}
              failedFiles={failedFiles}
              currentStages={processingStages}
              estimatedTimeRemaining={estimatedTimeRemaining ?? undefined}
              onRetryFile={(fileIndex) => {
                // TODO: Implement individual file retry
                console.log(`Retry file at index ${fileIndex}`);
              }}
            />
          ) : (
            currentProcessingFile && processingStages.length > 0 && (
              <ProcessingStatus
                fileName={currentProcessingFile}
                stages={processingStages}
                currentStage={processingStages.find(stage => stage.status === 'in_progress')?.id || undefined}
                error={processingError || undefined}
                onRetry={() => {
                  // Reset processing state for retry
                  setIsLoading(false);
                  setProcessingError(null);
                  setProcessingStages([]);
                  setCurrentProcessingFile(null);
                }}
              />
            )
          )}
        </div>
      )}
      
      {/* Questionnaire Reminder - show when processing but questionnaire is closed */}
      {isLoading && !showQuestionnaire && (
        <div className="mb-6">
          <Alert>
            <Info className="h-4 w-4" />
            <AlertTitle>Processing in Progress</AlertTitle>
            <AlertDescription className="flex items-center justify-between">
              <span>Documents are being processed. You can fill out the questionnaire while waiting.</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowQuestionnaire(true)}
                className="ml-4"
              >
                Open Questionnaire
              </Button>
            </AlertDescription>
          </Alert>
        </div>
      )}
      
          {/* Process Button */}
          <div className="flex justify-between items-center mt-6">
            <div className="text-sm text-gray-600">
              {files.length > 0 && (
                <div className="flex flex-col space-y-2">
                  <div className="flex items-center space-x-4">
                    <span>Ready to process {files.length} document{files.length !== 1 ? 's' : ''}</span>
                    <Badge variant="secondary" className="text-xs">
                      {files.length === 1 
                        ? '4-8 minutes per document' 
                        : `${Math.ceil(files.length * 4)}-${Math.ceil(files.length * 8)} minutes total`
                      }
                    </Badge>
                  </div>
                  <div className="text-xs text-gray-500">
                    ⏱️ Processing typically takes 4-8 minutes per document depending on size and complexity
                  </div>
                </div>
              )}
            </div>
            <Button 
              onClick={handleProcessFiles}
              disabled={files.length === 0 || isLoading}
              className="flex items-center space-x-2"
              size="lg"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Process Documents</span>
                </>
              )}
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
