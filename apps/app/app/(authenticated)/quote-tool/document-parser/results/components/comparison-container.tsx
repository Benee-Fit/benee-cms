'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@repo/design-system/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@repo/design-system/components/ui/tabs';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@repo/design-system/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '@repo/design-system/components/ui/alert';
import { Info, AlertCircle, ArrowUpDown } from 'lucide-react';
import MarketComparisonView from './market-comparison/MarketComparisonView';
import SingleCarrierView from './single-carrier-view';
import RenegotiatedComparison from './renegotiated-comparison';
import AlternativeComparison from './alternative-comparison';

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
    benefitDetails: Record<string, any>;
  }>;
  planNotes: Array<{ note: string }>;
}

export default function ComparisonContainer() {
  const [parsedDocuments, setParsedDocuments] = useState<ParsedDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentView, setCurrentView] = useState('market');
  const [selectedCarrier, setSelectedCarrier] = useState<string | null>(null);
  const [selectedCoverageType, setSelectedCoverageType] = useState<string | null>(null);
  const [availableCoverageTypes, setAvailableCoverageTypes] = useState<string[]>([]);
  const [availableCarriers, setAvailableCarriers] = useState<string[]>([]);
  
  // Document categories
  const [currentDocuments, setCurrentDocuments] = useState<ParsedDocument[]>([]);
  const [renegotiatedDocuments, setRenegotiatedDocuments] = useState<ParsedDocument[]>([]);
  const [alternativeDocuments, setAlternativeDocuments] = useState<ParsedDocument[]>([]);

  useEffect(() => {
    try {
      const storedData = localStorage.getItem('parsedBenefitsDocuments');
      
      if (storedData) {
        const data = JSON.parse(storedData) as ParsedDocument[];
        setParsedDocuments(data);

        // Extract and set unique coverage types and carriers
        const coverageTypes = new Set<string>();
        const carriers = new Set<string>();
        
        // Categorize documents
        const current: ParsedDocument[] = [];
        const renegotiated: ParsedDocument[] = [];
        const alternative: ParsedDocument[] = [];
        
        data.forEach(doc => {
          // Categorize documents
          if (doc.category === 'Current') {
            current.push(doc);
          } else if (doc.category === 'Renegotiated') {
            renegotiated.push(doc);
          } else if (doc.category === 'Alternative') {
            alternative.push(doc);
          }
          
          // Collect unique coverage types and carriers
          if (doc.coverages && Array.isArray(doc.coverages)) {
            doc.coverages.forEach(coverage => {
              if (coverage && coverage.coverageType) {
                coverageTypes.add(coverage.coverageType);
              }
              if (coverage && coverage.carrierName) {
                carriers.add(coverage.carrierName);
              }
            });
          }
        });
        
        setCurrentDocuments(current);
        setRenegotiatedDocuments(renegotiated);
        setAlternativeDocuments(alternative);
        setAvailableCoverageTypes(Array.from(coverageTypes));
        setAvailableCarriers(Array.from(carriers));
        
        // Set default selected carrier if available
        if (carriers.size > 0) {
          setSelectedCarrier(Array.from(carriers)[0]);
        }
      }
    } catch (e) {
      console.error('Failed to load or parse documents:', e);
      setError('Failed to load parsed data. It might be corrupted.');
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
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <Tabs defaultValue="market" className="w-full" onValueChange={setCurrentView}>
          <TabsList>
            <TabsTrigger value="market">Full Market</TabsTrigger>
            <TabsTrigger value="carrier" disabled={!selectedCarrier}>
              Carrier Details
            </TabsTrigger>
            {renegotiatedDocuments.length > 0 && (
              <TabsTrigger value="renegotiated">Renegotiated</TabsTrigger>
            )}
            {alternativeDocuments.length > 0 && (
              <TabsTrigger value="alternative">Alternative</TabsTrigger>
            )}
          </TabsList>
          
          <div className="flex flex-col sm:flex-row gap-2 mt-4 mb-2">
            <Select 
              value={selectedCoverageType || 'all'} 
              onValueChange={(value) => setSelectedCoverageType(value === 'all' ? null : value)}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filter by coverage type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Coverage Types</SelectItem>
                {availableCoverageTypes.map((type) => (
                  <SelectItem key={type} value={type}>{type}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {currentView === 'carrier' && (
              <Select 
                value={selectedCarrier || 'all'} 
                onValueChange={(value) => setSelectedCarrier(value === 'all' ? null : value)}
              >
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Select carrier" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Carriers</SelectItem>
                  {availableCarriers.map((carrier) => (
                    <SelectItem key={carrier} value={carrier}>{carrier}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            
            <Button variant="outline" size="sm" className="ml-auto">
              <ArrowUpDown className="mr-2 h-4 w-4" />
              Sort by Premium
            </Button>
          </div>
          
          <TabsContent value="market" className="mt-0">
            <MarketComparisonView 
              parsedDocuments={parsedDocuments}
              coverageTypesList={availableCoverageTypes}
              carriersMap={Object.fromEntries(availableCarriers.map(carrier => [
                carrier, 
                parsedDocuments
                  .filter(doc => doc.metadata?.carrierName === carrier)
                  .map(doc => doc.originalFileName)
              ]))}
            />
          </TabsContent>
          
          <TabsContent value="carrier" className="mt-4">
            <SingleCarrierView 
              documents={parsedDocuments.filter(
                doc => doc.metadata && doc.metadata.carrierName && doc.metadata.carrierName === selectedCarrier
              )}
              selectedCoverageType={selectedCoverageType}
              carrierName={selectedCarrier || 'Unknown Carrier'}
            />
          </TabsContent>
          
          <TabsContent value="renegotiated" className="mt-4">
            <RenegotiatedComparison 
              currentDocuments={currentDocuments}
              renegotiatedDocuments={renegotiatedDocuments}
              selectedCoverageType={selectedCoverageType}
            />
          </TabsContent>
          
          <TabsContent value="alternative" className="mt-4">
            <AlternativeComparison 
              currentDocuments={currentDocuments}
              alternativeDocuments={alternativeDocuments}
              selectedCoverageType={selectedCoverageType}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
