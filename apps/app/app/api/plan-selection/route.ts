import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { currentUser } from '@repo/auth/server';

/**
 * Interface for document with multiple plans
 */
interface DocumentWithPlans {
  documentId: string;
  fileName: string;
  carrierName: string;
  documentType: 'Current' | 'Renegotiated' | 'Alternative';
  detectedPlans: {
    planOptionName: string;
    totalMonthlyPremium: number;
    coverageTypes: string[];
    rateGuarantee?: string;
  }[];
  processedData: any; // Full processed data from Gemini
}

/**
 * Interface for plan selection request
 */
interface PlanSelectionRequest {
  documentId: string;
  selectedPlanOptions: string[];
  documentType: 'Current' | 'Renegotiated' | 'Alternative';
  includeHSA: boolean;
  hsaDetails?: {
    employerContribution: number;
    employeeContribution: number;
    maxAnnualContribution: number;
    eligibilityRequirements: string;
  };
}

/**
 * Interface for session storage of plan selections
 */
interface PlanSelectionSession {
  userId: string;
  documents: Array<{
    documentId: string;
    fileName: string;
    carrierName: string;
    documentType: 'Current' | 'Renegotiated' | 'Alternative';
    selectedPlans: string[];
    includeHSA: boolean;
    hsaDetails?: any;
    filteredData: any; // Filtered processedData based on selections
  }>;
  createdAt: string;
  updatedAt: string;
}

// In-memory storage for demo purposes
// In production, this would be stored in a database or Redis
const planSelectionSessions = new Map<string, PlanSelectionSession>();

/**
 * Helper function to filter coverage data by selected plan options
 */
function filterCoveragesByPlans(processedData: any, selectedPlans: string[]): any {
  if (!processedData) return processedData;

  // Handle both new and legacy formats
  if (processedData.highLevelOverview && processedData.granularBreakdown) {
    // New format
    return {
      ...processedData,
      highLevelOverview: processedData.highLevelOverview.filter((overview: any) =>
        selectedPlans.includes(overview.planOption)
      ),
      granularBreakdown: processedData.granularBreakdown.map((breakdown: any) => ({
        ...breakdown,
        carrierData: breakdown.carrierData.filter((carrier: any) =>
          selectedPlans.includes(carrier.planOption)
        )
      }))
    };
  } else {
    // Legacy format
    return {
      ...processedData,
      planOptions: processedData.planOptions?.filter((plan: any) =>
        selectedPlans.includes(plan.planOptionName)
      ),
      allCoverages: processedData.allCoverages?.filter((coverage: any) =>
        selectedPlans.includes(coverage.planOptionName)
      )
    };
  }
}

/**
 * Helper function to extract plan information from processed data
 */
function extractPlansFromProcessedData(processedData: any, fileName: string, carrierName: string): DocumentWithPlans {
  const documentId = `${fileName}-${Date.now()}`;
  
  if (processedData.highLevelOverview) {
    // New format
    const detectedPlans = processedData.highLevelOverview.map((overview: any) => ({
      planOptionName: overview.planOption,
      totalMonthlyPremium: overview.totalMonthlyPremium,
      coverageTypes: extractCoverageTypesFromGranular(processedData.granularBreakdown, overview.planOption),
      rateGuarantee: overview.rateGuarantee
    }));

    return {
      documentId,
      fileName,
      carrierName: carrierName || processedData.highLevelOverview[0]?.carrierName,
      documentType: 'Current',
      detectedPlans,
      processedData
    };
  } else {
    // Legacy format
    const detectedPlans = (processedData.planOptions || []).map((plan: any) => ({
      planOptionName: plan.planOptionName,
      totalMonthlyPremium: plan.carrierProposals?.[0]?.totalMonthlyPremium || 0,
      coverageTypes: extractCoverageTypesFromCoverages(processedData.allCoverages, plan.planOptionName),
      rateGuarantee: plan.carrierProposals?.[0]?.rateGuaranteeText
    }));

    return {
      documentId,
      fileName,
      carrierName,
      documentType: 'Current',
      detectedPlans,
      processedData
    };
  }
}

/**
 * Extract coverage types from granular breakdown
 */
function extractCoverageTypesFromGranular(granularBreakdown: any[], planOption: string): string[] {
  if (!granularBreakdown) return [];
  
  return granularBreakdown
    .filter(breakdown => 
      breakdown.carrierData.some((carrier: any) => 
        carrier.planOption === planOption && carrier.included
      )
    )
    .map(breakdown => breakdown.benefitType);
}

/**
 * Extract coverage types from legacy coverages array
 */
function extractCoverageTypesFromCoverages(allCoverages: any[], planOptionName: string): string[] {
  if (!allCoverages) return [];
  
  return [...new Set(
    allCoverages
      .filter(coverage => coverage.planOptionName === planOptionName)
      .map(coverage => coverage.coverageType)
  )];
}

/**
 * GET - Retrieve current plan selections for the user
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const user = await currentUser();
    if (!user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const session = planSelectionSessions.get(user.id);
    
    if (!session) {
      return NextResponse.json({
        success: true,
        documents: [],
        hasSelections: false
      });
    }

    return NextResponse.json({
      success: true,
      documents: session.documents,
      hasSelections: session.documents.length > 0,
      updatedAt: session.updatedAt
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to retrieve plan selections' },
      { status: 500 }
    );
  }
}

/**
 * POST - Save plan selections for documents
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const user = await currentUser();
    if (!user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const requestData = await request.json();
    const { documentSelections } = requestData as {
      documentSelections: Array<{
        documentId: string;
        fileName: string;
        carrierName: string;
        planQuoteTypes?: Record<string, string>;
        planHSAOptions?: Record<string, boolean>;
        planHSADetails?: Record<string, any>;
        selectedPlans: string[];
        processedData: any;
        // Legacy fields for backward compatibility
        documentType?: 'Current' | 'Renegotiated' | 'Alternative';
        includeHSA?: boolean;
        hsaDetails?: any;
      }>;
    };

    if (!documentSelections || !Array.isArray(documentSelections)) {
      return NextResponse.json(
        { 
          error: 'Invalid document selections format',
          details: 'Expected documentSelections to be an array',
          received: typeof documentSelections 
        },
        { status: 400 }
      );
    }

    if (documentSelections.length === 0) {
      return NextResponse.json(
        { 
          error: 'No documents provided',
          details: 'At least one document selection is required'
        },
        { status: 400 }
      );
    }

    // Validate each document selection
    for (let i = 0; i < documentSelections.length; i++) {
      const doc = documentSelections[i];
      if (!doc.documentId) {
        return NextResponse.json(
          { 
            error: 'Missing required field',
            details: `Document at index ${i} is missing documentId`
          },
          { status: 400 }
        );
      }
      if (!doc.fileName) {
        return NextResponse.json(
          { 
            error: 'Missing required field',
            details: `Document at index ${i} is missing fileName`
          },
          { status: 400 }
        );
      }
      if (!doc.carrierName) {
        return NextResponse.json(
          { 
            error: 'Missing required field',
            details: `Document at index ${i} is missing carrierName`
          },
          { status: 400 }
        );
      }
      if (!doc.processedData) {
        return NextResponse.json(
          { 
            error: 'Missing required field',
            details: `Document at index ${i} is missing processedData`
          },
          { status: 400 }
        );
      }
    }

    // Process each document selection
    const processedDocuments = documentSelections.map(doc => {
      // Determine document type from planQuoteTypes or use legacy field
      let documentType: 'Current' | 'Renegotiated' | 'Alternative' = 'Current';
      if (doc.planQuoteTypes) {
        const quoteTypes = Object.values(doc.planQuoteTypes);
        if (quoteTypes.includes('Current Premium')) {
          documentType = 'Current';
        } else if (quoteTypes.includes('Renegotiated')) {
          documentType = 'Renegotiated';
        } else if (quoteTypes.includes('Alternative')) {
          documentType = 'Alternative';
        }
      } else if (doc.documentType) {
        documentType = doc.documentType;
      }
      
      // Check if any plan has HSA enabled
      const includeHSA = doc.planHSAOptions ? Object.values(doc.planHSAOptions).some(Boolean) : (doc.includeHSA || false);
      
      return {
        documentId: doc.documentId,
        fileName: doc.fileName,
        carrierName: doc.carrierName,
        documentType,
        selectedPlans: doc.selectedPlans,
        includeHSA,
        hsaDetails: doc.planHSADetails || doc.hsaDetails,
        planQuoteTypes: doc.planQuoteTypes,
        planHSAOptions: doc.planHSAOptions,
        planHSADetails: doc.planHSADetails,
        filteredData: filterCoveragesByPlans(doc.processedData, doc.selectedPlans)
      };
    });

    // Save to session storage
    const session: PlanSelectionSession = {
      userId: user.id,
      documents: processedDocuments,
      createdAt: planSelectionSessions.get(user.id)?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    planSelectionSessions.set(user.id, session);

    return NextResponse.json({
      success: true,
      message: 'Plan selections saved successfully',
      documentsProcessed: processedDocuments.length,
      sessionId: user.id
    });
  } catch (error) {
    console.error('[DEBUG] Plan selection API error:', error);
    
    let errorMessage = 'Failed to save plan selections';
    let details = 'An unknown error occurred';
    
    if (error instanceof Error) {
      errorMessage = error.message;
      details = error.stack || error.message;
    } else if (typeof error === 'string') {
      errorMessage = error;
      details = error;
    }
    
    return NextResponse.json(
      { 
        error: errorMessage,
        details: details,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

/**
 * PUT - Update a specific document's plan selection
 */
export async function PUT(request: NextRequest): Promise<NextResponse> {
  try {
    const user = await currentUser();
    if (!user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { documentId, selectedPlans, documentType, includeHSA, hsaDetails } = await request.json();

    if (!documentId || !selectedPlans) {
      return NextResponse.json(
        { error: 'Document ID and selected plans are required' },
        { status: 400 }
      );
    }

    const session = planSelectionSessions.get(user.id);
    if (!session) {
      return NextResponse.json(
        { error: 'No plan selection session found' },
        { status: 404 }
      );
    }

    // Find and update the specific document
    const documentIndex = session.documents.findIndex(doc => doc.documentId === documentId);
    if (documentIndex === -1) {
      return NextResponse.json(
        { error: 'Document not found in session' },
        { status: 404 }
      );
    }

    session.documents[documentIndex] = {
      ...session.documents[documentIndex],
      selectedPlans,
      documentType,
      includeHSA,
      hsaDetails,
      filteredData: filterCoveragesByPlans(
        session.documents[documentIndex].filteredData, 
        selectedPlans
      )
    };

    session.updatedAt = new Date().toISOString();
    planSelectionSessions.set(user.id, session);

    return NextResponse.json({
      success: true,
      message: 'Document selection updated successfully',
      document: session.documents[documentIndex]
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update plan selection' },
      { status: 500 }
    );
  }
}

/**
 * DELETE - Remove a document from plan selections
 */
export async function DELETE(request: NextRequest): Promise<NextResponse> {
  try {
    const user = await currentUser();
    if (!user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const documentId = searchParams.get('documentId');

    if (!documentId) {
      return NextResponse.json(
        { error: 'Document ID is required' },
        { status: 400 }
      );
    }

    const session = planSelectionSessions.get(user.id);
    if (!session) {
      return NextResponse.json(
        { error: 'No plan selection session found' },
        { status: 404 }
      );
    }

    // Remove the document from the session
    session.documents = session.documents.filter(doc => doc.documentId !== documentId);
    session.updatedAt = new Date().toISOString();
    
    planSelectionSessions.set(user.id, session);

    return NextResponse.json({
      success: true,
      message: 'Document removed from plan selections',
      remainingDocuments: session.documents.length
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to remove document' },
      { status: 500 }
    );
  }
}