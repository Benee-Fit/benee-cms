import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@repo/design-system/components/ui/tabs';
import PremiumComparisonTable from './PremiumComparisonTable';
import PlanComparisonTab from './PlanComparisonTab';

interface ParsedDocument {
  // Add relevantCoverages to the interface to fix TypeScript issues
  relevantCoverages?: Array<{
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

interface MarketComparisonViewProps {
  parsedDocuments: ParsedDocument[];
  coverageTypesList?: string[];
  carriersMap: Record<string, string[]>;
}

const MarketComparisonView = ({
  parsedDocuments,
  carriersMap
}: MarketComparisonViewProps) => {
  // State
  const [activeTab, setActiveTab] = useState('premium');
  

  
  // Process documents to ensure proper structure
  const processedDocuments = parsedDocuments.map((doc: ParsedDocument) => {
    // Add relevantCoverages property with normalized coverages
    return {
      ...doc,
      relevantCoverages: doc.coverages
    };
  });
  
  return (
    <div className="space-y-4">
      {/* Tabs for Premium and Plan comparison */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-2 mb-4">
          <TabsTrigger value="premium">Premium Comparison</TabsTrigger>
          <TabsTrigger value="plan">Plan Comparison</TabsTrigger>
        </TabsList>
        
        <TabsContent value="premium" className="mt-0">
          <PremiumComparisonTable results={processedDocuments} />
        </TabsContent>
        
        <TabsContent value="plan" className="mt-0">
          <PlanComparisonTab results={processedDocuments} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MarketComparisonView;
