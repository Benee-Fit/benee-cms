'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@repo/design-system/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@repo/design-system/components/ui/alert';
import { Info, RefreshCw, Clipboard, Database } from 'lucide-react';
import { Header } from '../../../components/header';
// Import ComparisonContainer component
import ComparisonContainer from './components/comparison-container';

// Define the parsed document type
interface ParsedDocument {
  originalFileName: string;
  category: string;
  metadata: {
    documentType: string;
    clientName: string;
    carrierName: string;
    effectiveDate: string;
    quoteDate: string;
    policyNumber?: string;
    planOptionName?: string;
    totalProposedMonthlyPlanPremium?: number;
    fileName: string;
    fileCategory: string;
    planOptionTotals?: {
      planOptionName: string;
      totalMonthlyPremium: number;
    }[];
    rateGuarantees?: string;
  };
  coverages: {
    coverageType: string;
    carrierName: string;
    planOptionName: string;
    premium: number;
    monthlyPremium: number;
    unitRate: number;
    unitRateBasis: string;
    volume: number;
    lives: number;
    benefitDetails: Record<string, unknown>;
  }[];
  planNotes: { note: string }[];
}

export default function DocumentParserResultsPage() {
  const router = useRouter();
  const [parsedDocuments, setParsedDocuments] = useState<ParsedDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showRawData, setShowRawData] = useState(false);

  // Load parsed documents from localStorage
  useEffect(() => {
    try {
      const storedData = localStorage.getItem('parsedBenefitsDocuments');
      
      if (storedData) {
        const data = JSON.parse(storedData) as ParsedDocument[];
        setParsedDocuments(data);
      } else {
        setError('No parsed document data found in storage.');
      }
    } catch (_e) {
      // Handle error safely without using console.error
      setError('Failed to load parsed data. It might be corrupted.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Navigate back to parser page
  const handleReturnToParser = () => {
    router.push('/quote-tool/document-parser');
  };

  // Clear results and return to parser
  const handleClearAndReturn = () => {
    localStorage.removeItem('parsedBenefitsDocuments');
    router.push('/quote-tool/document-parser');
  };

  // Copy raw JSON data to clipboard
  const handleCopyJson = () => {
    try {
      const jsonData = JSON.stringify(parsedDocuments, null, 2);
      navigator.clipboard.writeText(jsonData);
      alert('JSON data copied to clipboard');
    } catch (_e) {
      // Handle error safely
      alert('Failed to copy JSON data');
    }
  };

  // Toggle raw data view
  const toggleRawData = () => {
    setShowRawData(!showRawData);
  };

  if (isLoading) {
    return (
      <>
        <Header pages={["Quote Tool"]} page="Document Parser Results">
          <h2 className="text-xl font-semibold">Results</h2>
        </Header>
        
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          <div className="bg-muted/50 flex-1 min-h-[50vh] md:min-h-min rounded-xl p-6">
            <div className="flex justify-center items-center h-40">
              <RefreshCw className="h-6 w-6 animate-spin text-primary" />
              <span className="ml-2">Loading results...</span>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Header pages={["Quote Tool"]} page="Document Parser Results">
        <h2 className="text-xl font-semibold">Market Comparison</h2>
      </Header>
      
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        <div className="bg-muted/50 flex-1 min-h-[50vh] md:min-h-min rounded-xl p-6">
          {/* Error Alert */}
          {error && (
            <Alert variant="destructive" className="mb-6">
              <Info className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          {/* Empty Results Notice */}
          {parsedDocuments.length === 0 && !error && (
            <Alert className="mb-6">
              <Info className="h-4 w-4" />
              <AlertTitle>No Results</AlertTitle>
              <AlertDescription>
                No parsed document data found. Please upload and process documents first.
              </AlertDescription>
            </Alert>
          )}
      
          {/* Results Summary */}
          {parsedDocuments.length > 0 && (
            <div className="mb-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
                <div>
                  <h2 className="text-2xl font-bold">
                    Market Comparison
                  </h2>
                  <p className="text-muted-foreground">
                    {parsedDocuments.length} document{parsedDocuments.length !== 1 ? 's' : ''} analyzed
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" size="sm" onClick={toggleRawData}>
                    {showRawData ? (
                      <>
                        <Database className="h-4 w-4 mr-2" />
                        <span>Show Comparison View</span>
                      </>
                    ) : (
                      <>
                        <Clipboard className="h-4 w-4 mr-2" />
                        <span>Show Raw JSON</span>
                      </>
                    )}
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleCopyJson}>
                    Copy JSON
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleReturnToParser}>
                    Upload More
                  </Button>
                  <Button variant="destructive" size="sm" onClick={handleClearAndReturn}>
                    Clear & Return
                  </Button>
                </div>
              </div>
              
              {showRawData ? (
                // Raw JSON Data View
                <div className="mt-6 space-y-6">
                  {parsedDocuments.map((doc, index) => (
                    <details key={index} className="bg-white rounded-lg shadow-sm open:shadow-md transition-all duration-200">
                      <summary className="text-lg font-medium p-4 cursor-pointer hover:bg-gray-50">
                        {doc.metadata.carrierName} - {doc.originalFileName}
                        <span className="ml-2 text-sm px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                          {doc.category}
                        </span>
                      </summary>
                      <div className="p-4 pt-0 border-t">
                        <pre className="text-xs overflow-auto bg-muted/10 p-4 rounded-md max-h-96">
                          {JSON.stringify(doc, null, 2)}
                        </pre>
                      </div>
                    </details>
                  ))}
                </div>
              ) : (
                // Comparison View
                <div className="bg-white p-6 rounded-lg shadow-sm">
                  <ComparisonContainer />
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
