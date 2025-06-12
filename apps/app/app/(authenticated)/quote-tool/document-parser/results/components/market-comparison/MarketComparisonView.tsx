import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@repo/design-system/components/ui/tabs';
import { useState } from 'react';
import PlanComparisonTab from './PlanComparisonTab';
import { PremiumComparisonTable } from './PremiumComparisonTable';
import type { ParsedDocumentResult, ParsedDocument, EnhancedProcessedData } from '../../../types';

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

  // Check if any document has the new enhanced format
  const enhancedData = parsedDocuments.find(doc => 
    doc.processedData && 
    (doc.processedData as EnhancedProcessedData).highLevelOverview && 
    (doc.processedData as EnhancedProcessedData).granularBreakdown
  )?.processedData as EnhancedProcessedData | undefined;

  // Function to convert new format to existing table format (when needed)
  const convertNewFormatToLegacy = (enhancedData: EnhancedProcessedData): ParsedDocumentResult[] => {
    if (!enhancedData.highLevelOverview) return [];
    
    // Create legacy format from highLevelOverview data
    return enhancedData.highLevelOverview.map(overview => ({
      metadata: {
        clientName: 'Enhanced Client',
        carrierName: overview.carrierName,
        primaryCarrierName: overview.carrierName,
        effectiveDate: new Date().toISOString().split('T')[0],
        quoteDate: new Date().toISOString().split('T')[0],
        documentType: 'Enhanced Document',
        policyNumber: null,
        rateGuarantees: overview.rateGuarantee ? [overview.rateGuarantee] : null,
      },
      allCoverages: [
        // Create synthetic coverages for the existing table layout
        {
          coverageType: 'Pooled Benefits',
          carrierName: overview.carrierName,
          planOptionName: overview.planOption,
          premium: overview.pooledBenefitsSubtotal,
          monthlyPremium: overview.pooledBenefitsSubtotal,
          unitRate: null,
          unitRateBasis: '',
          volume: null,
          lives: 0,
          benefitDetails: { note: 'Pooled benefits subtotal' }
        },
        {
          coverageType: 'Experience Rated',
          carrierName: overview.carrierName,
          planOptionName: overview.planOption,
          premium: overview.experienceRatedSubtotal,
          monthlyPremium: overview.experienceRatedSubtotal,
          unitRate: null,
          unitRateBasis: '',
          volume: null,
          lives: 0,
          benefitDetails: { note: 'Experience rated subtotal' }
        }
      ],
      planOptions: [{
        planOptionName: overview.planOption,
        rateGuarantees: overview.rateGuarantee ? [overview.rateGuarantee] : [],
        planOptionTotals: {
          monthlyPremium: overview.totalMonthlyPremium
        }
      }],
      planNotes: [overview.keyHighlights]
    }));
  };

  // Process documents for premium comparison
  const premiumDocuments: ParsedDocumentResult[] = enhancedData 
    ? convertNewFormatToLegacy(enhancedData)
    : parsedDocuments.map((doc: ParsedDocument) => {
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

  // Function to convert granular breakdown to legacy format for plan comparison
  const convertGranularToLegacy = (enhancedData: EnhancedProcessedData): ParsedDocument[] => {
    if (!enhancedData.granularBreakdown) return [];
    
    // Group by carrier to create separate documents
    const carrierGroups = enhancedData.granularBreakdown.reduce((acc, breakdown) => {
      breakdown.carrierData.forEach(carrier => {
        if (!acc[carrier.carrierName]) {
          acc[carrier.carrierName] = {
            carrierName: carrier.carrierName,
            planOption: carrier.planOption,
            coverages: []
          };
        }
        
        if (carrier.included) {
          acc[carrier.carrierName].coverages.push({
            coverageType: breakdown.benefitType,
            carrierName: carrier.carrierName,
            planOptionName: carrier.planOption,
            premium: carrier.monthlyPremium || 0,
            monthlyPremium: carrier.monthlyPremium || 0,
            unitRate: carrier.unitRate || 0,
            unitRateBasis: 'per unit',
            volume: carrier.volume || 0,
            lives: 0,
            benefitDetails: carrier.coverageDetails || { note: 'Enhanced coverage details' }
          });
        }
      });
      return acc;
    }, {} as Record<string, { carrierName: string, planOption: string, coverages: any[] }>);

    return Object.values(carrierGroups).map(group => ({
      originalFileName: `Enhanced ${group.carrierName} Document`,
      category: 'Enhanced',
      metadata: {
        documentType: 'Enhanced Document',
        clientName: 'Enhanced Client',
        carrierName: group.carrierName,
        effectiveDate: new Date().toISOString().split('T')[0],
        quoteDate: new Date().toISOString().split('T')[0],
        policyNumber: undefined,
        planOptionName: group.planOption,
        totalProposedMonthlyPlanPremium: group.coverages.reduce((sum, cov) => sum + (cov.monthlyPremium || 0), 0),
        fileName: `enhanced-${group.carrierName.toLowerCase()}.json`,
        fileCategory: 'Enhanced',
        planOptionTotals: [],
        rateGuarantees: undefined
      },
      coverages: group.coverages,
      planNotes: [{ note: 'Generated from enhanced data format' }]
    }));
  };

  // Choose which data to use for plan comparison
  const planComparisonDocuments = enhancedData && enhancedData.granularBreakdown 
    ? convertGranularToLegacy(enhancedData)
    : parsedDocuments.filter(doc => 
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
      );

  return (
    <div className="space-y-4">
      {/* Enhanced format indicator */}
      {enhancedData && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="font-medium text-green-800">Enhanced Format Detected</span>
          </div>
          <p className="text-green-700 mt-1">
            Using new enhanced data format with {enhancedData.highLevelOverview?.length || 0} overview items 
            and {enhancedData.granularBreakdown?.length || 0} detailed breakdown items.
          </p>
        </div>
      )}
      
      {/* Tabs for Premium and Plan comparison */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-2 mb-4">
          <TabsTrigger value="premium">Premium Comparison</TabsTrigger>
          <TabsTrigger value="plan">Plan Comparison</TabsTrigger>
        </TabsList>

        <TabsContent value="premium" className="mt-0">
          <PremiumComparisonTable 
            results={premiumDocuments} 
            highLevelOverview={enhancedData?.highLevelOverview}
          />
        </TabsContent>

        <TabsContent value="plan" className="mt-0">
          <PlanComparisonTab results={planComparisonDocuments} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MarketComparisonView;
