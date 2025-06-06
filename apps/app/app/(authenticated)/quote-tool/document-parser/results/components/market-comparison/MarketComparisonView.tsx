import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@repo/design-system/components/ui/tabs';
import { useState } from 'react';
import PlanComparisonTab from './PlanComparisonTab';
import { PremiumComparisonTable } from './PremiumComparisonTable';
import type { ParsedDocumentResult, ParsedDocument } from '../../../types';

// Use the ParsedDocument interface from types.ts

interface MarketComparisonViewProps {
  parsedDocuments: ParsedDocument[];
  coverageTypesList?: string[];
  carriersMap: Record<string, string[]>;
}

const MarketComparisonView = ({
  parsedDocuments,
  carriersMap,
}: MarketComparisonViewProps) => {
  
  // State
  const [activeTab, setActiveTab] = useState('premium');

  // Process documents for premium comparison
  const premiumDocuments: ParsedDocumentResult[] = parsedDocuments.map((doc: ParsedDocument) => {
    // Extract unique plan option names
    const planOptionNames: string[] = [];
    
    // Use for...of instead of forEach to satisfy lint rules
    for (const coverage of doc.coverages) {
      if (coverage.planOptionName && !planOptionNames.includes(coverage.planOptionName)) {
        planOptionNames.push(coverage.planOptionName);
      }
    }

    // Create plan options array
    const planOptions = planOptionNames.map(name => ({
      planOptionName: name,
      rateGuarantees: doc.metadata.rateGuarantees ? [doc.metadata.rateGuarantees] : [],
      planOptionTotals: {
        monthlyPremium: doc.metadata.totalProposedMonthlyPlanPremium
      }
    }));

    // Convert to the correct type for PremiumComparisonTable
    const result = {
      metadata: {
        clientName: doc.metadata.clientName,
        carrierName: doc.metadata.carrierName,
        primaryCarrierName: doc.metadata.carrierName,
        effectiveDate: doc.metadata.effectiveDate,
        quoteDate: doc.metadata.quoteDate,
        documentType: doc.metadata.documentType,
        policyNumber: doc.metadata.policyNumber || null,
        rateGuarantees: doc.metadata.rateGuarantees ? [doc.metadata.rateGuarantees] : null,
      },
      allCoverages: doc.coverages,
      planOptions: planOptions,
      planNotes: doc.planNotes?.map(note => note.note) || []
    };
    
    
    return result;
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
          <PremiumComparisonTable results={premiumDocuments} />
        </TabsContent>

        <TabsContent value="plan" className="mt-0">
          <PlanComparisonTab results={parsedDocuments.filter(doc => 
            doc.coverages.length > 0 && doc.coverages.some(coverage => 
              coverage.coverageType && 
              coverage.carrierName && 
              coverage.benefitDetails && 
              // Allow null unitRate for certain coverage types
              ((coverage.coverageType === 'Extended Healthcare' || 
                coverage.coverageType === 'Dental Care') || 
               coverage.unitRate !== undefined) && 
              // Ensure at least monthly premium is available
              typeof coverage.monthlyPremium === 'number'
            )
          )} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MarketComparisonView;
