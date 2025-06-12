// NEW - Enhanced JSON structure types (for backward compatibility)
export interface HighLevelOverview {
  carrierName: string;
  planOption: string;
  totalMonthlyPremium: number;
  rateGuarantee: string;
  pooledBenefitsSubtotal: number;
  experienceRatedSubtotal: number;
  keyHighlights: string;
}

export interface GranularBreakdown {
  benefitCategory: string;
  benefitType: string;
  carrierData: Array<{
    carrierName: string;
    planOption: string;
    included: boolean;
    volume?: number | null;
    unitRate?: number | null;
    monthlyPremium?: number | null;
    coverageDetails: any;
  }>;
}

// Enhanced response type that can contain both old and new formats
export interface EnhancedProcessedData {
  // Old format (backward compatibility)
  metadata?: {
    clientName?: string;
    carrierName?: string;
    primaryCarrierName?: string | null;
    effectiveDate?: string;
    quoteDate?: string;
    documentType?: string;
    policyNumber?: string | null | undefined;
    rateGuarantees?: string[] | string | null;
    totalProposedMonthlyPlanPremium?: number;
  };
  allCoverages?: Coverage[];
  planOptions?: PlanOption[];
  planNotes?: string[] | Array<{ note: string }>;
  // New format
  highLevelOverview?: HighLevelOverview[];
  granularBreakdown?: GranularBreakdown[];
}

// Define types for parsed document results
export interface Coverage {
  coverageType: string;
  carrierName: string;
  planOptionName?: string;
  premium?: number | string;
  monthlyPremium: number | string;
  unitRate?: number | string | null;
  unitRateBasis?: string;
  volume?: number | string | null;
  lives?: number;
  benefitDetails?: Record<string, unknown>;
}

export interface PlanOption {
  planOptionName: string;
  rateGuarantees?: string[];
  planOptionTotals?: {
    monthlyPremium?: number | string;
    annualPremium?: number | string;
  }
}

export interface ParsedDocumentResult {
  metadata: {
    clientName?: string;
    carrierName?: string;
    primaryCarrierName?: string | null;
    effectiveDate?: string;
    quoteDate?: string;
    documentType?: string;
    policyNumber?: string | null | undefined;
    rateGuarantees?: string[] | string | null;
  };
  allCoverages?: Coverage[];
  planOptions: PlanOption[];
  planNotes?: string[] | Array<{ note: string }>;
}

// Interface for the original document structure used in the app
export interface ParsedDocument {
  originalFileName: string;
  category: string;
  relevantCoverages?: Coverage[];
  processedData?: EnhancedProcessedData;
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
    reportPreparedBy?: string;
  };
  coverages: Coverage[];
  planNotes: Array<{ note: string }>;
}
