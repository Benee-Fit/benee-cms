'use client';

import React from 'react';
import SummaryStats from '../app/(authenticated)/quote-tool/document-parser/results/components/SummaryStats';
import MarketComparisonView from '../app/(authenticated)/quote-tool/document-parser/results/components/market-comparison/MarketComparisonView';
import type { ParsedDocument } from '../app/(authenticated)/quote-tool/document-parser/types';

// Enhanced transform function to properly map premium data
const transformReportDataToParsedDocuments = (reportData: any): ParsedDocument[] => {
  if (!reportData.documents) return [];
  
  return reportData.documents.map((doc: any) => {
    const processedData = doc.processedData || {};
    
    // Extract coverages with proper premium data
    let enhancedCoverages = doc.coverages || [];
    
    // If we have processedData with planOptions, create proper coverage entries
    if (processedData.planOptions && processedData.planOptions.length > 0) {
      const planOption = processedData.planOptions[0];
      const carrierProposal = planOption.carrierProposals?.[0];
      
      // First, try to use allCoverages from processedData (this contains the actual premium data)
      if (processedData.allCoverages && processedData.allCoverages.length > 0) {
        enhancedCoverages = processedData.allCoverages.map((coverage: any) => {
          const enhanced = {
            coverageType: coverage.coverageType,
            carrierName: coverage.carrierName || doc.metadata?.carrierName,
            planOptionName: coverage.planOptionName || planOption.planOptionName,
            premium: coverage.premium || coverage.monthlyPremium || 0,
            monthlyPremium: coverage.monthlyPremium || coverage.premium || 0,
            unitRate: coverage.unitRate || null,
            unitRateBasis: coverage.unitRateBasis || 'per unit',
            volume: coverage.volume || null,
            lives: coverage.lives || 0,
            benefitDetails: coverage.benefitDetails || {}
          };

          // For EHC and Dental, we need to handle Single/Family breakdown
          if (coverage.coverageType === 'Extended Healthcare' || coverage.coverageType === 'Dental Care') {
            // If we have lives data, assume it's all family (since single would be 0 premium typically)
            if (coverage.lives && coverage.lives > 0) {
              (enhanced as any).livesFamily = coverage.lives;
              (enhanced as any).livesSingle = 0;
              (enhanced as any).premiumPerFamily = coverage.monthlyPremium ? coverage.monthlyPremium / coverage.lives : 0;
              (enhanced as any).premiumPerSingle = 0;
            }
          }

          return enhanced;
        });
      } else if (carrierProposal && carrierProposal.coverageBreakdown) {
        // If we have detailed coverage breakdown, use it
        enhancedCoverages = Object.entries(carrierProposal.coverageBreakdown).map(([coverageType, details]: [string, any]) => ({
          coverageType,
          carrierName: carrierProposal.carrierName || doc.metadata?.carrierName,
          planOptionName: planOption.planOptionName,
          premium: details.monthlyPremium || details.premium || 0,
          monthlyPremium: details.monthlyPremium || details.premium || 0,
          unitRate: details.unitRate || null,
          unitRateBasis: details.unitRateBasis || 'per unit',
          volume: details.volume || null,
          lives: details.lives || 0,
          benefitDetails: details.benefitDetails || {}
        }));
      } else if (carrierProposal && carrierProposal.totalMonthlyPremium > 0) {
        // If no breakdown, enhance existing coverages with plan data
        enhancedCoverages = doc.coverages?.map((coverage: any) => ({
          ...coverage,
          planOptionName: planOption.planOptionName,
          carrierName: carrierProposal.carrierName || coverage.carrierName || doc.metadata?.carrierName,
          monthlyPremium: coverage.monthlyPremium || 0,
          premium: coverage.premium || coverage.monthlyPremium || 0
        })) || [];
      }
      
      // Add subtotal rows for experience rated and pooled benefits
      if (carrierProposal?.subtotals) {
        if (carrierProposal.subtotals.experienceRated !== undefined) {
          enhancedCoverages.push({
            coverageType: 'Sub-total - Experience Rated Benefits',
            carrierName: carrierProposal.carrierName || doc.metadata?.carrierName,
            planOptionName: planOption.planOptionName,
            premium: carrierProposal.subtotals.experienceRated,
            monthlyPremium: carrierProposal.subtotals.experienceRated,
            unitRate: null,
            unitRateBasis: '',
            volume: null,
            lives: 0,
            benefitDetails: { isSubtotal: true }
          });
        }
        
        if (carrierProposal.subtotals.pooled !== undefined) {
          enhancedCoverages.push({
            coverageType: 'Sub-total - Pooled Benefits',
            carrierName: carrierProposal.carrierName || doc.metadata?.carrierName,
            planOptionName: planOption.planOptionName,
            premium: carrierProposal.subtotals.pooled,
            monthlyPremium: carrierProposal.subtotals.pooled,
            unitRate: null,
            unitRateBasis: '',
            volume: null,
            lives: 0,
            benefitDetails: { isSubtotal: true }
          });
        }
      }
      
      // Add total row
      if (carrierProposal?.totalMonthlyPremium) {
        enhancedCoverages.push({
          coverageType: 'TOTAL MONTHLY PREMIUM',
          carrierName: carrierProposal.carrierName || doc.metadata?.carrierName,
          planOptionName: planOption.planOptionName,
          premium: carrierProposal.totalMonthlyPremium,
          monthlyPremium: carrierProposal.totalMonthlyPremium,
          unitRate: null,
          unitRateBasis: '',
          volume: null,
          lives: 0,
          benefitDetails: { isTotal: true }
        });
      }
    }
    
    return {
      originalFileName: doc.metadata?.fileName || `${doc.metadata?.clientName} - ${doc.metadata?.carrierName}.pdf` || 'Unknown Document',
      category: doc.category || 'Current',
      metadata: {
        documentType: doc.metadata?.documentType || 'Proposal',
        clientName: doc.metadata?.clientName || 'Unknown Client',
        carrierName: doc.metadata?.carrierName || 'Unknown Carrier',
        effectiveDate: doc.metadata?.effectiveDate || '',
        quoteDate: doc.metadata?.quoteDate || '',
        policyNumber: doc.metadata?.policyNumber || undefined,
        planOptionName: processedData.planOptions?.[0]?.planOptionName || doc.planOptionName || 'Default Plan',
        totalProposedMonthlyPlanPremium: processedData.planOptions?.[0]?.carrierProposals?.[0]?.totalMonthlyPremium || 0,
        fileName: doc.metadata?.fileName || 'unknown.pdf',
        fileCategory: doc.category || 'Current',
        planOptionTotals: processedData.planOptions?.map((option: any) => ({
          planOptionName: option.planOptionName,
          totalMonthlyPremium: option.carrierProposals?.[0]?.totalMonthlyPremium || 0
        })) || [],
        rateGuarantees: processedData.planOptions?.[0]?.carrierProposals?.[0]?.rateGuaranteeText || doc.metadata?.rateGuarantees || ''
      },
      coverages: enhancedCoverages,
      planNotes: doc.planNotes || [],
      processedData: processedData,
      relevantCoverages: enhancedCoverages
    };
  });
};

interface SharedReportViewProps {
  reportData: any;
}


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
      <SummaryStats parsedDocuments={transformedDocuments as any} />

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
            parsedDocuments={transformedDocuments as any}
            carriersMap={carriersMap}
          />
        </div>
      </div>
    </div>
  );
}