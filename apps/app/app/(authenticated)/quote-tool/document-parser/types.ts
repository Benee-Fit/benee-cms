// Define types for parsed document results
export interface Coverage {
  coverageType: string;
  carrierName?: string;
  planOptionName?: string;
  premium?: number | string;
  monthlyPremium?: number | string;
  unitRate?: number | string | null;
  unitRateBasis?: string;
  volume?: number | string;
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
  planNotes?: string[];
}

// Interface for the original document structure used in the app
export interface ParsedDocument {
  originalFileName: string;
  category: string;
  relevantCoverages?: Coverage[];
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
  coverages: Coverage[];
  planNotes: Array<{ note: string }>;
}
