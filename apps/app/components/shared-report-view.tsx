'use client';

import React from 'react';
import SummaryStats from '../app/(authenticated)/quote-tool/document-parser/results/components/SummaryStats';
import MarketComparisonView from '../app/(authenticated)/quote-tool/document-parser/results/components/market-comparison/MarketComparisonView';
import CarrierOverviewCards from '../app/(authenticated)/quote-tool/document-parser/results/components/CarrierOverviewCards';
import type { ParsedDocument } from '../app/(authenticated)/quote-tool/document-parser/types';

interface SharedReportViewProps {
  reportData: any;
}

// Transform saved report data to ParsedDocument format for read-only display
const transformReportDataToParsedDocuments = (reportData: any): ParsedDocument[] => {
  if (!reportData.documents) return [];
  
  return reportData.documents.map((doc: any) => {
    // Extract the full processedData if available
    const processedData = doc.processedData || {};
    
    // Build the transformed document
    const transformedDoc: ParsedDocument = {
      originalFileName: doc.metadata?.fileName || `${doc.metadata?.clientName} - ${doc.metadata?.carrierName}.pdf` || 'Unknown Document',
      category: doc.category || 'Current',
      metadata: {
        documentType: doc.metadata?.documentType || 'Proposal',
        clientName: doc.metadata?.clientName || 'Unknown Client',
        carrierName: doc.metadata?.carrierName || 'Unknown Carrier',
        effectiveDate: doc.metadata?.effectiveDate || '',
        quoteDate: doc.metadata?.quoteDate || '',
        policyNumber: doc.metadata?.policyNumber || undefined,
        planOptionName: doc.planOptionName || 'Default Plan',
        totalProposedMonthlyPlanPremium: processedData.planOptions?.[0]?.carrierProposals?.[0]?.totalMonthlyPremium || 0,
        fileName: doc.metadata?.fileName || 'unknown.pdf',
        fileCategory: doc.category || 'Current',
        planOptionTotals: processedData.planOptions?.map((option: any) => ({
          planOptionName: option.planOptionName,
          totalMonthlyPremium: option.carrierProposals?.[0]?.totalMonthlyPremium || 0
        })) || [],
        rateGuarantees: doc.metadata?.rateGuarantees || ''
      },
      coverages: doc.coverages?.map((coverage: any) => ({
        coverageType: coverage.coverageType || 'Unknown Coverage',
        carrierName: coverage.carrierName || doc.metadata?.carrierName || 'Unknown Carrier',
        planOptionName: coverage.planOptionName || 'Default Plan',
        premium: coverage.premium || coverage.monthlyPremium || 0,
        monthlyPremium: coverage.monthlyPremium || 0,
        unitRate: coverage.unitRate || 0,
        unitRateBasis: coverage.unitRateBasis || '',
        volume: coverage.volume || 0,
        lives: coverage.lives || 0,
        benefitDetails: coverage.benefitDetails || {}
      })) || [],
      planNotes: doc.planNotes || [],
      // Pass through the full processedData structure
      processedData: processedData
    };
    
    // If we have granularBreakdown data (new format), ensure it's included
    if (processedData.granularBreakdown) {
      transformedDoc.processedData = {
        ...processedData,
        highLevelOverview: processedData.highLevelOverview || [],
        granularBreakdown: processedData.granularBreakdown || []
      };
    }
    
    // If we have planOptions (legacy format), ensure the full structure is preserved
    if (processedData.planOptions) {
      transformedDoc.processedData = {
        ...processedData,
        metadata: processedData.metadata || doc.metadata,
        planOptions: processedData.planOptions,
        allCoverages: processedData.allCoverages || doc.coverages || []
      };
    }
    
    return transformedDoc;
  });
};

export default function SharedReportView({ reportData }: SharedReportViewProps) {
  if (!reportData || !reportData.documents) {
    return <div>No report data available</div>;
  }

  const transformedDocuments = transformReportDataToParsedDocuments(reportData);
  const carriersMap = Object.fromEntries((reportData.carriers || []).map((carrier: string) => [
    carrier, 
    transformedDocuments
      .filter(doc => doc.metadata?.carrierName === carrier)
      .map(doc => doc.originalFileName)
  ]));

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <SummaryStats parsedDocuments={transformedDocuments} />

      {/* Professional Comparison Tables */}
      <div className="space-y-8">
        {/* Add read-only styling to disable edits */}
        <style jsx global>{`
          .shared-report .editable-cell {
            pointer-events: none !important;
            background-color: transparent !important;
          }
          .shared-report .editable-cell input {
            pointer-events: none !important;
            background-color: transparent !important;
            border: none !important;
            box-shadow: none !important;
          }
          .shared-report .edit-icon {
            display: none !important;
          }
          .shared-report select {
            pointer-events: none !important;
          }
          .shared-report button[role="combobox"] {
            pointer-events: none !important;
          }
        `}</style>
        
        <div className="shared-report">
          {/* Professional Market Comparison */}
          <MarketComparisonView 
            parsedDocuments={transformedDocuments}
            carriersMap={carriersMap}
          />
          
          {/* Carrier Overview Cards */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Carrier Summary</h3>
            <CarrierOverviewCards parsedDocuments={transformedDocuments} />
          </div>
        </div>
      </div>
    </div>
  );
}