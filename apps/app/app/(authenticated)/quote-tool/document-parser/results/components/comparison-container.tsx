'use client';

import { useState, useEffect } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@repo/design-system/components/ui/alert';
import { Button } from '@repo/design-system/components/ui/button';
import { Textarea } from '@repo/design-system/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@repo/design-system/components/ui/card';
import { Info, AlertCircle, Save } from 'lucide-react';
import MarketComparisonView from './market-comparison/MarketComparisonView';

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
    planOptionTotals?: Array<{
      planOptionName: string;
      totalMonthlyPremium: number;
    }>;
    rateGuarantees?: string;
  };
  coverages: Array<{
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
  }>;
  planNotes: Array<{ note: string }>;
}

export default function ComparisonContainer() {
  
  const [parsedDocuments, setParsedDocuments] = useState<ParsedDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [availableCarriers, setAvailableCarriers] = useState<string[]>([]);
  const [additionalNotes, setAdditionalNotes] = useState('');
  const [isSavingNotes, setIsSavingNotes] = useState(false);
  const [notesSaved, setNotesSaved] = useState(false);

  useEffect(() => {
    try {
      const storedData = localStorage.getItem('parsedBenefitsDocuments');
      
      if (storedData) {
        const data = JSON.parse(storedData) as ParsedDocument[];
        setParsedDocuments(data);

        // Extract and set unique carriers
        const carriers = new Set<string>();
        
        for (const doc of data) {
          // Collect unique carriers
          if (doc.coverages && Array.isArray(doc.coverages)) {
            for (const coverage of doc.coverages) {
              if (coverage?.carrierName) {
                carriers.add(coverage.carrierName);
              }
            }
          }
        }
        
        setAvailableCarriers(Array.from(carriers));
      }
      
      // Load saved notes from localStorage
      const savedNotes = localStorage.getItem('quoteToolAdditionalNotes');
      if (savedNotes) {
        setAdditionalNotes(savedNotes);
      }
    } catch (e) {
      // Error is captured in state variable instead of console
      setError(`Failed to load or parse documents: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setIsLoading(false);
    }
  }, []);

  if (isLoading) {
    return <div className="flex justify-center items-center h-40">Loading comparison data...</div>;
  }

  if (error) {
    return (
      <Alert variant="destructive" className="mb-6">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (parsedDocuments.length === 0) {
    return (
      <Alert className="mb-6">
        <Info className="h-4 w-4" />
        <AlertTitle>No data available</AlertTitle>
        <AlertDescription>
          No parsed documents found for comparison. Please upload and process documents first.
        </AlertDescription>
      </Alert>
    );
  }

  const handleSaveNotes = () => {
    setIsSavingNotes(true);
    setNotesSaved(false);
    
    // Save to localStorage
    localStorage.setItem('quoteToolAdditionalNotes', additionalNotes);
    
    // Simulate save delay for better UX
    setTimeout(() => {
      setIsSavingNotes(false);
      setNotesSaved(true);
      
      // Hide saved message after 3 seconds
      setTimeout(() => {
        setNotesSaved(false);
      }, 3000);
    }, 500);
  };

  return (
    <div className="space-y-8">
      {/* Detailed Market Comparison */}
      <div>
        <MarketComparisonView 
          parsedDocuments={parsedDocuments}
          carriersMap={Object.fromEntries(availableCarriers.map(carrier => [
            carrier, 
            parsedDocuments
              .filter(doc => doc.metadata?.carrierName === carrier)
              .map(doc => doc.originalFileName)
          ]))}
        />
      </div>
      
      {/* Additional Notes Section */}
      <Card>
        <CardHeader>
          <CardTitle>Additional Notes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            value={additionalNotes}
            onChange={(e) => setAdditionalNotes(e.target.value)}
            placeholder="Enter any additional notes or comments about this quote comparison..."
            className="min-h-[200px] resize-y"
          />
          <div className="flex items-center justify-between">
            <div>
              {notesSaved && (
                <p className="text-sm text-green-600">Notes saved successfully!</p>
              )}
            </div>
            <Button 
              onClick={handleSaveNotes}
              disabled={isSavingNotes}
            >
              <Save className="h-4 w-4 mr-2" />
              {isSavingNotes ? 'Saving...' : 'Save Notes'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
