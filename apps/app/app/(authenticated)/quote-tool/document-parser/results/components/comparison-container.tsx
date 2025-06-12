'use client';

import { useState, useEffect } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@repo/design-system/components/ui/alert';
import { Info, AlertCircle } from 'lucide-react';
import MarketComparisonView from './market-comparison/MarketComparisonView';
import CarrierOverviewCards from './CarrierOverviewCards';
import SummaryStats from './SummaryStats';

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


  return (
    <div className="space-y-8">
      {/* Summary Statistics */}
      <SummaryStats parsedDocuments={parsedDocuments} />
      
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
      
      {/* Carrier Overview Cards */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Carrier Summary</h3>
        <CarrierOverviewCards parsedDocuments={parsedDocuments} />
      </div>
    </div>
  );
}
