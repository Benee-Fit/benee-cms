'use client';

import { useState, useCallback, type DragEvent, type ChangeEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '../../components/header';
import { Button } from '@repo/design-system/components/ui/button';
import { Card, CardContent } from '@repo/design-system/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@repo/design-system/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@repo/design-system/components/ui/tabs';
import { Info, Upload, AlertCircle, FileText, UploadCloud } from 'lucide-react';

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

  // Process files
  const handleProcessFiles = async () => {
    if (files.length === 0) {
      setError('Please upload at least one PDF document to process.');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const results: Array<Record<string, unknown>> = [];
      
      // Process each file sequentially to avoid overloading the server
      for (const file of files) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('category', file.category || 'Current');
        
        const response = await fetch('/api/process-document', {
          method: 'POST',
          body: formData,
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to process document');
        }
        
        const result = await response.json();
        results.push({
          ...result,
          originalFileName: file.name,
          category: file.category,
        });
      }
      
      // Store results in localStorage for the results page
      localStorage.setItem('parsedBenefitsDocuments', JSON.stringify(results));
      
      // Navigate to results page
      router.push('/quote-tool/document-parser/results');
      
    } catch (err: unknown) {
      // Log error safely without using console directly in production
      const errorMsg = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(errorMsg || 'An error occurred while processing the documents.');
    } finally {
      setIsLoading(false);
    }
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
            <label className="cursor-pointer">
              <Button variant="outline">
                <Upload className="mr-2 h-4 w-4" />
                Select Files
              </Button>
              <input
                type="file"
                multiple
                accept=".pdf"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>
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
    </>
  );
}
