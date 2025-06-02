'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { FormWrapper } from '@/components/enrolment/form-wrapper';
import { useToast } from '@/hooks/use-toast';
import { pdfFiller } from '@/ai/flows/pdf-filler';
import type { AppStage, FormValues } from '@/lib/types/enrolment';
import { questionnaireFields, defaultFormValues } from '@/lib/config/form-fields';
import { AlertCircle, Download, FileCheck, Loader2, RefreshCw } from 'lucide-react';

// Constants for PDF templates
// Using a path relative to the public directory which will be accessible via browser fetch
const PDF_TEMPLATE_PATH = '/pdf_templates/group_source_enrolment_form_template.pdf';

// Function to get the PDF template path - in the future, this can be modified to pull from app settings
// This function can be expanded to load different templates based on application settings
const getPdfTemplatePath = () => PDF_TEMPLATE_PATH;

export default function Home() {
  const [appStage, setAppStage] = useState<AppStage>('fill_form');
  const [formValues, setFormValues] = useState<FormValues>(defaultFormValues);
  const [generatedPdfDataUri, setGeneratedPdfDataUri] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Effect to clear error when stage changes
  useEffect(() => {
    setError(null);
  }, [appStage]);

  // Function to load PDF template from file path
  const loadPdfTemplate = async (filePath: string): Promise<string> => {
    try {
      console.log('Fetching template from:', filePath);
      // In a browser environment, we need to fetch the file
      const response = await fetch(filePath);
      if (!response.ok) {
        console.error('Fetch failed:', response.status, response.statusText);
        throw new Error(`Failed to fetch template: ${response.statusText}`);
      }
      
      const blob = await response.blob();
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64data = reader.result;
          console.log('PDF template loaded successfully');
          resolve(base64data as string);
        };
        reader.onerror = () => {
          console.error('FileReader error');
          reject(new Error('Failed to convert PDF to data URI'));
        };
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.error(`Error loading PDF template from ${filePath}:`, error);
      throw new Error(`Failed to load PDF template: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  const handleFormSubmit = async (data: FormValues) => {
    console.log('Form submission received:', data);
    
    // Just to be sure, check if employment fields are provided
    const requiredEmploymentFields = [
      'planSponsorName',
      'personalIdNumber',
      'memberNumber',
      'occupation',
      'dateFullTimeEmployment',
      'dateEligibleCoverage',
      'annualEarnings',
      'hoursPerWeek',
      'deptDivLocation'
    ];
    
    // Log what fields are missing, if any
    const missingFields = requiredEmploymentFields.filter(field => !data[field]);
    if (missingFields.length > 0) {
      console.warn('Missing required fields:', missingFields);
    } else {
      console.log('All required employment fields are filled!');
    }
    
    setFormValues(data);
    setIsLoading(true);
    setAppStage('generating_pdf');
    setError(null);

    try {
      // Load the PDF template from the predefined path
      const templatePath = getPdfTemplatePath();
      console.log('Loading PDF template from:', templatePath);
      const pdfTemplateDataUri = await loadPdfTemplate(templatePath);
      console.log('PDF template loaded successfully');
      
      // Fill the PDF with form data
      console.log('Calling PDF filler with data');
      const result = await pdfFiller({
        pdfTemplateDataUri,
        formData: data as Record<string, string>,
      });
      console.log('PDF filler returned result');
      
      setGeneratedPdfDataUri(result.filledPdfDataUri);
      setAppStage('download_pdf');
      toast({ title: 'PDF Generated!', description: 'Your document is ready for download.', className: 'bg-accent text-accent-foreground' });
    } catch (err) {
      console.error('PDF generation failed:', err);
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred during PDF generation.';
      setError(`PDF generation failed: ${errorMessage}`);
      toast({ title: 'Generation Error', description: `Failed to generate PDF: ${errorMessage}`, variant: 'destructive' });
      setAppStage('fill_form'); // Go back to form to allow retry or corrections
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadPdf = async () => {
    if (!generatedPdfDataUri) {
      toast({ title: 'Download Error', description: 'PDF data not available.', variant: 'destructive' });
      return;
    }
    
    // Show loading state
    setIsLoading(true);
    toast({ title: 'Preparing Download', description: 'Please wait while we prepare your PDF...', className: 'bg-secondary text-secondary-foreground' });
    
    try {
      // Store the PDF on the server
      const response = await fetch('/api/pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ pdfDataUri: generatedPdfDataUri }),
      });
      
      if (!response.ok) {
        throw new Error(`Server responded with ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (!data.filename) {
        throw new Error('No filename returned from server');
      }
      
      // Create a direct download link to the PDF using the new download endpoint
      const downloadUrl = `/api/pdf/download?filename=${encodeURIComponent(data.filename)}`;
      
      // Create an invisible iframe for download (more reliable than window.location)
      const iframe = document.createElement('iframe');
      iframe.style.display = 'none';
      document.body.appendChild(iframe);
      iframe.src = downloadUrl;
      
      // Show success message
      toast({ title: 'Download Started', description: 'Your PDF is downloading.', className: 'bg-accent text-accent-foreground' });
      
      // Clean up the iframe after a delay
      setTimeout(() => {
        if (document.body.contains(iframe)) {
          document.body.removeChild(iframe);
        }
      }, 5000);
    } catch (error) {
      console.error('PDF download error:', error);
      toast({ title: 'Download Failed', description: 'Could not download the PDF. Please try again.', variant: 'destructive' });
      
      // Fallback: Try to open the PDF in a new tab
      try {
        window.open(generatedPdfDataUri, '_blank');
      } catch (e) {
        console.error('Fallback open failed:', e);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartOver = () => {
    setAppStage('fill_form');
    setFormValues(defaultFormValues);
    setGeneratedPdfDataUri(null);
    setError(null);
  };

  const renderContent = () => {
    if (error && appStage !== 'generating_pdf') { // Show general error prominently if not in loading state
      return (
        <Card className="w-full shadow-xl">
          <CardHeader>
            <CardTitle className="text-destructive flex items-center gap-2"><AlertCircle /> Error</CardTitle>
          </CardHeader>
          <CardContent>
            <Alert variant="destructive">
              <AlertTitle>An Error Occurred</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          </CardContent>
          <CardFooter>
            <Button onClick={handleStartOver} variant="outline" className="gap-2">
              <RefreshCw size={18} /> Try Again
            </Button>
          </CardFooter>
        </Card>
      );
    }
    
    switch (appStage) {
      case 'fill_form':
        return (
          <FormWrapper
            fields={questionnaireFields}
            onFormSubmit={handleFormSubmit}
            isLoading={isLoading}
            initialData={formValues}
          />
        );
      case 'generating_pdf':
        return (
          <Card className="w-full shadow-xl">
            <CardHeader>
              <CardTitle className="text-2xl font-semibold">Generating Your Document</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center space-y-4 py-12">
              <Loader2 size={64} className="animate-spin text-primary" />
              <p className="text-lg text-muted-foreground">Please wait, we're preparing your PDF...</p>
            </CardContent>
          </Card>
        );
      case 'download_pdf':
        return (
          <Card className="w-full shadow-xl">
            <CardHeader>
              <CardTitle className="text-2xl font-semibold">Your Document is Ready!</CardTitle>
              <CardDescription>Download your generated PDF or start over with a new template.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center space-y-6 py-10">
              <div className="bg-secondary/50 rounded-lg p-8 flex flex-col items-center">
                <FileCheck size={64} className="text-primary mb-4" />
                <p className="text-center text-muted-foreground mb-6">Your document has been successfully generated and is ready to download.</p>
                <Button onClick={handleDownloadPdf} size="lg" className="gap-2 w-full md:w-auto">
                  <Download size={20} /> Download PDF
                </Button>
              </div>
            </CardContent>
            <CardFooter className="border-t pt-6">
              <Button onClick={handleStartOver} variant="outline" className="w-full gap-2">
                <RefreshCw size={18} /> Start Over
              </Button>
            </CardFooter>
          </Card>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-[calc(100vh-var(--header-height,80px))] flex flex-col items-center justify-center bg-gradient-to-br from-background to-secondary/30 p-4 sm:p-8 selection:bg-primary/20 selection:text-primary">
      <div className="w-full max-w-2xl">
        {renderContent()}
      </div>
      <footer className="text-center text-sm text-muted-foreground mt-12">
        <p>&copy; {new Date().getFullYear()} Benee-fit. All rights reserved.</p>
      </footer>
    </div>
  );
}