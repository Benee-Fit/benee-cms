import * as https from 'node:https';
import {
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Import auth module from the repo package
import { currentUser } from '@repo/auth/server';

// Import PDF.co API integration specific constants
const PDF_CO_HOSTNAME = 'api.pdf.co';
// Import the enhanced prompt (originally designed for Gemini, now used with Claude)
import { ENHANCED_GEMINI_PROMPT } from './gemini-prompt-enhanced';

// API Keys from environment variables (only define what's used)
const PDFCO_API_KEY = process.env.PDF_UPLOAD_SECRET;
const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY;

// S3 configuration (DigitalOcean Spaces)
const DO_SPACES_KEY = process.env.DO_SPACES_KEY;
const DO_SPACES_SECRET = process.env.DO_SPACES_SECRET;
const DO_SPACES_REGION = process.env.DO_SPACES_REGION || 'us-east-1';
const DO_SPACES_BUCKET = process.env.DO_SPACES_BUCKET;

// S3 (DigitalOcean Spaces) configuration
const s3Client = new S3Client({
  region: DO_SPACES_REGION,
  credentials: {
    accessKeyId: DO_SPACES_KEY as string,
    secretAccessKey: DO_SPACES_SECRET as string,
  },
  endpoint: `https://${DO_SPACES_REGION}.digitaloceanspaces.com`,
});

// Define regex patterns at the module level for better performance
const jsonBlockRegex = /```(?:json)?\s*([\s\S]*?)\s*```/;
const fileExtensionRegex = /\.\w+$/;

/**
 * Type definitions for API responses
 */
// Plan option total information
interface PlanOptionTotal {
  planOptionName: string;
  totalMonthlyPremium: number;
}

// Rate guarantee information with period and details
interface RateGuarantee {
  coverageType?: string;
  duration?: string;
  endDate?: string;
  period?: string;
  details?: string;
}

// Document metadata including client, carrier, dates, and totals
interface Metadata {
  documentType?: string;
  clientName?: string;
  primaryCarrierName?: string;
  carrierName?: string;
  reportPreparedBy?: string;
  effectiveDate?: string;
  expiryDate?: string;
  quoteDate?: string;
  policyNumber?: string;
  fileName?: string;
  fileCategory?: string;
  dependentChildDefinition?: string;
  benefitYear?: string;
  rateGuaranteeConditions?: string[] | string;
  employeeAssistanceProgramGlobal?: string;
}

// Common volumes for plan options
interface CommonVolumes {
  [key: string]: number;
}

// Specific carrier proposal for a plan option
interface CarrierProposal {
  carrierName: string;
  totalMonthlyPremium: number;
  subtotals?: {
    pooledBenefits?: number;
    experienceRatedBenefits?: number;
    healthSpendingAccount?: number | null;
    adminFees?: number | null;
  } | null;
  rateGuaranteeText?: string;
  targetLossRatioText?: string;
  largeAmountPoolingText?: string | number;
  specificCarrierNotes?: string[];
  isRecommendedOrPrimaryInDocument?: boolean;
}

// Plan option representing a distinct benefit plan configuration
interface PlanOption {
  planOptionName: string;
  planOptionBenefitSummary?: Record<string, string> | null;
  commonVolumes?: CommonVolumes | null;
  carrierProposals: CarrierProposal[];
}

// Benefit details for coverage entries, allowing for flexible key-value pairs
interface BenefitDetails {
  [key: string]: string | number | null | undefined | Record<string, unknown>;
  note?: string;
}

// Coverage entry representing a single insurance coverage
interface CoverageEntry {
  coverageType: string;
  carrierName: string;
  planOptionName: string;
  premium: number;
  monthlyPremium: number;
  unitRate: number;
  unitRateBasis: string;
  volume: number;
  lives: number;
  benefitDetails: BenefitDetails;
}

// Plan notes for additional document information
interface PlanNote {
  note: string;
}

// Structure of the new Claude response format
interface ClaudeResponseFormat {
  highLevelOverview?: Array<{
    carrierName: string;
    planOption: string;
    totalMonthlyPremium: number;
    rateGuarantee?: string;
    pooledBenefitsSubtotal?: number;
    experienceRatedSubtotal?: number;
    keyHighlights?: string[];
  }>;
  granularBreakdown?: Array<{
    benefitCategory: string;
    benefitType: string;
    carrierData: Record<string, {
      volume?: {
        total?: string | number;
        single?: number;
        family?: number;
        breakdown?: {
          employees?: number;
          dependents?: number;
        };
      };
      unitRate?: {
        single?: number;
        family?: number;
        basis?: string;
        currency?: string;
      };
      monthlyPremium?: {
        total?: number;
        single?: number;
        family?: number;
        currency?: string;
      };
      coverage?: {
        amount?: number;
        type?: string;
        currency?: string;
        details?: string;
        included?: boolean;
        coinsurance?: number;
        maximum?: string | number;
        frequency?: string;
        deductible?: number;
        formulary?: string;
        payDirectCard?: boolean;
        cardNumber?: string;
        dispensingFee?: boolean;
        spouseAmount?: number;
        childAmount?: number;
        feeGuide?: string;
        preventativeFrequency?: string;
        scalingUnits?: number;
        perPractitioner?: boolean;
        pooling?: string;
      };
    }>;
  }>;
}

// Structure of the parsed response from Claude API
interface ClaudeParsedResponse {
  metadata?: Metadata;
  planOptions?: PlanOption[];
  allCoverages?: CoverageEntry[];
  documentNotes?: string[];
}

// Options for HTTPS request options interface
interface HttpsRequestOptions {
  hostname: string;
  port?: number;
  path: string;
  method: string;
  headers: Record<string, string>;
}

// HTTPS response data structure
interface HttpsResponseData {
  statusCode?: number;
  data?: string;
  error?: string;
  presignedUrl?: string;
  url?: string;
  rawResponse?: string;
}

// Claude API error response
interface ClaudeErrorResponse {
  type: string;
  error: {
    type: string;
    message: string;
  };
}

// Claude API success response
interface ClaudeSuccessResponse {
  id: string;
  type: string;
  role: string;
  content: {
    type: string;
    text: string;
  }[];
  model: string;
  stop_reason: string;
  stop_sequence: string | null;
  usage: {
    input_tokens: number;
    output_tokens: number;
  };
}

/**
 * Helper function to make HTTPS requests
 * @param options HTTPS request options
 * @param data Optional data to send in the request body
 * @returns Promise resolving to the response data
 */
function makeHttpsRequest(
  options: HttpsRequestOptions,
  data?: string
): Promise<HttpsResponseData> {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let responseData = '';

      res.on('data', (chunk) => {
        responseData += chunk;
      });

      res.on('end', () => {
        if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
          resolve({
            statusCode: res.statusCode,
            data: responseData,
            rawResponse: responseData,
          });
        } else {
          // For non-2xx responses, populate the error field
          resolve({
            statusCode: res.statusCode,
            error: `HTTP Error: ${res.statusCode} ${res.statusMessage}. Response: ${responseData.substring(0, 200)}${responseData.length > 200 ? '...' : ''}`,
            data: responseData, // Still provide data as it might contain useful error details
            rawResponse: responseData,
          });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (data) {
      req.write(data);
    }

    req.end();
  });
}

/**
 * Transform the new Claude response format to the legacy format expected by the frontend
 * @param claudeResponse The new Claude response format
 * @returns Transformed response in the legacy format
 */
function transformClaudeResponse(claudeResponse: ClaudeResponseFormat): ClaudeParsedResponse {
  const { highLevelOverview = [], granularBreakdown = [] } = claudeResponse;
  
  // Extract metadata from high level overview
  const firstOverview = highLevelOverview[0];
  const metadata: Metadata = {
    primaryCarrierName: firstOverview?.carrierName || 'Unknown Carrier',
    carrierName: firstOverview?.carrierName || 'Unknown Carrier',
    documentType: 'Quote',
    clientName: 'Unknown Client',
    effectiveDate: new Date().toISOString().split('T')[0],
    quoteDate: new Date().toISOString().split('T')[0],
  };

  // Extract plan options from high level overview
  const planOptions: PlanOption[] = highLevelOverview.map(overview => ({
    planOptionName: overview.planOption,
    planOptionBenefitSummary: overview.keyHighlights ? 
      overview.keyHighlights.reduce((acc, highlight, index) => {
        acc[`highlight_${index + 1}`] = highlight;
        return acc;
      }, {} as Record<string, string>) : null,
    commonVolumes: null,
    carrierProposals: [{
      carrierName: overview.carrierName,
      totalMonthlyPremium: overview.totalMonthlyPremium,
      subtotals: {
        pooledBenefits: overview.pooledBenefitsSubtotal || null,
        experienceRatedBenefits: overview.experienceRatedSubtotal || null,
        healthSpendingAccount: null,
        adminFees: null,
      },
      rateGuaranteeText: overview.rateGuarantee,
      isRecommendedOrPrimaryInDocument: true,
    }]
  }));

  // Transform granular breakdown to coverage entries
  const allCoverages: CoverageEntry[] = [];
  
  for (const breakdown of granularBreakdown) {
    const { benefitType, carrierData } = breakdown;
    
    // Normalize coverage type
    let coverageType = benefitType;
    if (benefitType.includes('Basic Life') || benefitType.includes('Employee Term Life')) {
      coverageType = 'Basic Life';
    } else if (benefitType.includes('Healthcare') || benefitType.includes('Health')) {
      coverageType = 'Extended Healthcare';
    } else if (benefitType.includes('Dental')) {
      coverageType = 'Dental Care';
    } else if (benefitType.includes('Vision')) {
      coverageType = 'Vision';
    } else if (benefitType.includes('AD&D')) {
      coverageType = 'AD&D';
    } else if (benefitType.includes('Dependent Life')) {
      coverageType = 'Dependent Life';
    } else if (benefitType.includes('Prescription Drugs')) {
      coverageType = 'Extended Healthcare';
    }
    
    for (const [carrierPlanKey, data] of Object.entries(carrierData)) {
      // Extract carrier name and plan option from the key
      const [carrierName, ...planParts] = carrierPlanKey.split(' - ');
      const planOptionName = planParts.join(' - ') || 'Default Plan';
      
      // Skip if coverage is not included
      if (data.coverage?.included === false) {
        continue;
      }
      
      // Debug premium extraction
      if (benefitType.includes('Dental') || benefitType.includes('Prescription') || benefitType.includes('Healthcare')) {
        console.log(`[DEBUG] Processing ${benefitType} for ${carrierPlanKey}:`);
        console.log(`[DEBUG] Monthly Premium Data:`, JSON.stringify(data.monthlyPremium, null, 2));
        console.log(`[DEBUG] Unit Rate Data:`, JSON.stringify(data.unitRate, null, 2));
        console.log(`[DEBUG] Volume Data:`, JSON.stringify(data.volume, null, 2));
      }
      
      const coverage: CoverageEntry = {
        coverageType,
        carrierName: carrierName || 'Unknown Carrier',
        planOptionName,
        premium: data.monthlyPremium?.total || 0,
        monthlyPremium: data.monthlyPremium?.total || 0,
        unitRate: data.unitRate?.single || data.unitRate?.family || 0,
        unitRateBasis: data.unitRate?.basis || 'per unit',
        volume: typeof data.volume?.total === 'string' ? 
          Number.parseFloat(data.volume.total.replace(/,/g, '')) : 
          (data.volume?.total as number) || data.volume?.single || data.volume?.family || 0,
        lives: data.volume?.breakdown?.employees || 0,
        // Add individual premium rates for Extended Healthcare and Dental Care
        ...(data.monthlyPremium?.single !== undefined && {
          livesSingle: data.volume?.single || 1,
          premiumPerSingle: data.monthlyPremium.single,
        }),
        ...(data.monthlyPremium?.family !== undefined && {
          livesFamily: data.volume?.family || data.volume?.breakdown?.dependents || 1,
          premiumPerFamily: data.monthlyPremium.family,
        }),
        // Also check if we have unit rates for single/family to use as premiumPerSingle/Family
        ...(!data.monthlyPremium?.single && data.unitRate?.single !== undefined && {
          livesSingle: data.volume?.single || 1,
          premiumPerSingle: data.unitRate.single,
        }),
        ...(!data.monthlyPremium?.family && data.unitRate?.family !== undefined && {
          livesFamily: data.volume?.family || data.volume?.breakdown?.dependents || 1,
          premiumPerFamily: data.unitRate.family,
        }),
        benefitDetails: {
          details: data.coverage?.details || 'Details not specified',
          coinsurance: data.coverage?.coinsurance,
          maximum: data.coverage?.maximum,
          frequency: data.coverage?.frequency,
          deductible: data.coverage?.deductible,
          amount: data.coverage?.amount,
          currency: data.coverage?.currency || data.unitRate?.currency,
          formulary: data.coverage?.formulary,
          payDirectCard: data.coverage?.payDirectCard ? 'Yes' : 'No',
          cardNumber: data.coverage?.cardNumber,
          spouseAmount: data.coverage?.spouseAmount,
          childAmount: data.coverage?.childAmount,
          feeGuide: data.coverage?.feeGuide,
          preventativeFrequency: data.coverage?.preventativeFrequency,
          scalingUnits: data.coverage?.scalingUnits,
          perPractitioner: data.coverage?.perPractitioner ? 'Yes' : 'No',
          pooling: data.coverage?.pooling,
        }
      };
      
      allCoverages.push(coverage);
    }
  }

  return {
    metadata,
    planOptions,
    allCoverages,
    documentNotes: [],
  };
}

/**
 * Extract JSON from a Claude API response text, handling markdown code blocks
 * @param text The response text from Claude API
 * @returns Parsed JSON object or null if parsing fails
 */
function extractJsonFromClaudeResponse(
  text: string
): ClaudeParsedResponse | null {
  try {
    // First, try to extract JSON from code blocks using regex
    console.log('[DEBUG] Attempting to extract JSON from code blocks...');
    const match = text.match(jsonBlockRegex);
    let parsedJson: unknown = null;
    
    if (match?.[1]) {
      console.log('[DEBUG] Found JSON code block, attempting to parse...');
      try {
        parsedJson = JSON.parse(match[1]);
      } catch (e) {
        console.warn('[WARN] Failed to parse JSON from code block:', e);
        console.log(
          `[DEBUG] Code block content sample: ${match[1].substring(0, 300)}...`
        );
      }
    } else {
      console.log('[DEBUG] No JSON code block found in the response');
    }

    // If no code block or parsing failed, try to parse the entire text as JSON
    if (!parsedJson) {
      try {
        parsedJson = JSON.parse(text);
      } catch (e) {
        console.warn('Failed to parse entire text as JSON:', e);
        return null;
      }
    }

    // Check if it's the new Claude format and transform it
    if (parsedJson && typeof parsedJson === 'object' && parsedJson !== null) {
      const jsonObj = parsedJson as Record<string, unknown>;
      
      console.log('[DEBUG] JSON object keys:', Object.keys(jsonObj));
      console.log('[DEBUG] Has highLevelOverview:', !!jsonObj.highLevelOverview);
      console.log('[DEBUG] Has granularBreakdown:', !!jsonObj.granularBreakdown);
      console.log('[DEBUG] Has metadata:', !!jsonObj.metadata);
      console.log('[DEBUG] Has allCoverages:', !!jsonObj.allCoverages);
      
      if (jsonObj.highLevelOverview || jsonObj.granularBreakdown) {
        console.log('[DEBUG] Detected new Claude response format, transforming...');
        console.log('[DEBUG] Full Claude response:', JSON.stringify(jsonObj, null, 2));
        return transformClaudeResponse(jsonObj as ClaudeResponseFormat);
      }

      // If it's already in the legacy format, return as is
      if (jsonObj.metadata || jsonObj.allCoverages || jsonObj.planOptions) {
        console.log('[DEBUG] Detected legacy response format, using as is...');
        console.log('[DEBUG] Legacy response sample:', JSON.stringify({
          metadata: !!jsonObj.metadata,
          allCoverages: Array.isArray(jsonObj.allCoverages) ? jsonObj.allCoverages.length : 'not array',
          planOptions: Array.isArray(jsonObj.planOptions) ? jsonObj.planOptions.length : 'not array'
        }));
        return jsonObj as ClaudeParsedResponse;
      }
    }

    console.warn('[WARN] Unrecognized response format');
    return null;
  } catch (error) {
    console.error('Error extracting JSON from Claude response:', error);
    return null;
  }
}

/**
 * Validates coverage entries to ensure they have all required fields
 * @param coverages Array of coverage entries to validate
 * @returns Object containing valid coverages and counts
 */
function validateCoverages(coverages: CoverageEntry[]): {
  validCoverages: CoverageEntry[];
  validCount: number;
  invalidCount: number;
} {
  if (!coverages || !Array.isArray(coverages)) {
    return { validCoverages: [], validCount: 0, invalidCount: 0 };
  }

  const validCoverages: CoverageEntry[] = [];
  let invalidCount = 0;

  for (const coverage of coverages) {
    // Check for required fields
    // EHC and Dental Care may have null values for unitRate, unitRateBasis, and volume
    // They use premiumPer(Single/Family) fields instead
    const isHealthOrDental =
      coverage.coverageType === 'Extended Healthcare' ||
      coverage.coverageType === 'Dental Care';

    if (
      !coverage.coverageType ||
      !coverage.carrierName ||
      !coverage.planOptionName ||
      typeof coverage.premium !== 'number' ||
      typeof coverage.monthlyPremium !== 'number' ||
      // Allow null unitRate and unitRateBasis for EHC/Dental and for coverage types that don't use traditional unit rates
      (!isHealthOrDental &&
        coverage.unitRate !== null &&
        typeof coverage.unitRate !== 'number') ||
      (!isHealthOrDental && !coverage.unitRateBasis) ||
      // Allow null volume for EHC/Dental
      (!isHealthOrDental &&
        typeof coverage.volume !== 'number' &&
        coverage.volume !== null) ||
      (typeof coverage.lives !== 'number' && coverage.lives !== null) ||
      !coverage.benefitDetails
    ) {
      invalidCount++;
      continue;
    }

    // Add validated coverage to the list
    validCoverages.push(coverage);
  }

  return {
    validCoverages,
    validCount: validCoverages.length,
    invalidCount,
  };
}

/**
 * Creates default coverage entries when no valid coverages are found
 * @param metadata Metadata from the Claude API response
 * @returns Array containing a default coverage entry
 */
function createDefaultCoverages(metadata?: Metadata): CoverageEntry[] {
  // Default values if metadata is not available
  const carrierName =
    metadata?.primaryCarrierName || metadata?.carrierName || 'Default Carrier';

  // Try to get a plan option name from metadata, if available
  const planOptionName = 'Default Plan';

  // Create a basic coverage entry for Basic Life
  return [
    {
      coverageType: 'Basic Life',
      carrierName,
      planOptionName,
      premium: 0,
      monthlyPremium: 0,
      unitRate: 0,
      unitRateBasis: 'per $1000',
      volume: 0,
      lives: 0,
      benefitDetails: {
        note: 'Default coverage created due to parsing error',
      },
    },
  ];
}

/**
 * Options for HTTPS requests
 */
interface HttpsRequestOptions {
  hostname: string;
  path: string;
  method: string;
  headers: Record<string, string>;
}

/**
 * HTTPS response data structure
 */
interface HttpsResponseData {
  statusCode?: number;
  data?: string;
  error?: string;
  presignedUrl?: string;
  url?: string;
  rawResponse?: string;
}

/**
 * File upload parameters
 */
interface UploadFileParams {
  userId: string;
  file: Buffer;
  filename: string;
  contentType: string;
  type: 'upload' | 'processed';
}

/**
 * File upload result
 */
interface UploadFileResult {
  key: string;
  url: string;
}

/**
 * File URL parameters
 */
interface GetFileUrlParams {
  userId: string;
  filename: string;
  type: 'upload' | 'processed';
}

/**
 * Uploads a file to DigitalOcean Spaces (S3-compatible storage)
 * @param params Upload parameters
 * @returns Promise resolving to the file upload result
 */
async function uploadFile(params: UploadFileParams): Promise<UploadFileResult> {
  // Get folder key based on user ID and document type
  const folderKey = `${params.userId}/${params.type}`;

  // Generate unique key for the file
  const fileKey = `${folderKey}/${params.filename}`;

  // Command to upload file to S3
  const command = new PutObjectCommand({
    Bucket: DO_SPACES_BUCKET,
    Key: fileKey,
    Body: params.file,
    ContentType: params.contentType,
  });

  try {
    await s3Client.send(command);
    const url = await getSignedUrl(
      s3Client,
      new GetObjectCommand({
        Bucket: DO_SPACES_BUCKET,
        Key: fileKey,
      }),
      { expiresIn: 3600 }
    );

    return { key: fileKey, url };
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Failed to upload file: ${errorMessage}`);
  }
}

/**
 * Generates a pre-signed URL for accessing a file in S3
 * @param params File URL parameters
 * @returns Promise resolving to the pre-signed URL
 */
async function getFileUrl(params: GetFileUrlParams): Promise<string> {
  // Generate the file key based on parameters
  const fileKey = `${params.userId}/${params.type}/${params.filename}`;

  // Create a GetObject command for the file
  const command = new GetObjectCommand({
    Bucket: DO_SPACES_BUCKET,
    Key: fileKey,
  });

  try {
    return await getSignedUrl(s3Client, command, { expiresIn: 3600 });
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Failed to generate pre-signed URL: ${errorMessage}`);
  }
}

/**
 * Extracts text from a PDF document using PDF.co API
 * @param fileBuffer The PDF file buffer
 * @returns Promise resolving to the extracted text
 */
async function extractTextFromPdf(fileBuffer: Buffer): Promise<string> {
  const PDF_CO_HOSTNAME = 'api.pdf.co';
  const PDFCO_API_KEY = process.env.PDF_UPLOAD_SECRET;

  if (!PDFCO_API_KEY) {
    throw new Error('PDF.co API key is missing');
  }

  try {
    // Validate the buffer
    if (!fileBuffer || fileBuffer.length === 0) {
      throw new Error('Empty or invalid PDF buffer');
    }

    // Check if buffer is likely a PDF (starts with PDF header)
    const isPdfHeader = fileBuffer.slice(0, 4).toString() === '%PDF';
    if (!isPdfHeader) {
      throw new Error(
        'File does not appear to be a valid PDF (missing %PDF header)'
      );
    }

    // First upload the file to DigitalOcean Spaces
    console.log('[INFO] Starting PDF text extraction...');
    console.log('[DEBUG] Uploading PDF to DigitalOcean Spaces first...');

    // Generate a unique filename for this upload
    const timestamp = new Date().getTime();
    const randomString = Math.random().toString(36).substring(2, 10);
    const filename = `pdf-extraction-${timestamp}-${randomString}.pdf`;

    // Upload to DigitalOcean Spaces
    const uploadResult = await uploadFile({
      userId: 'system', // Using 'system' as the user ID for this temporary file
      file: fileBuffer,
      filename: filename,
      contentType: 'application/pdf',
      type: 'upload',
    });

    console.log(
      `[DEBUG] File uploaded to DigitalOcean Spaces: ${uploadResult.url}`
    );

    // Now send the URL to PDF.co for text extraction
    console.log('[DEBUG] Sending URL to PDF.co for text extraction...');

    const extractTextOptions: HttpsRequestOptions = {
      hostname: PDF_CO_HOSTNAME,
      path: '/v1/pdf/convert/to/text',
      method: 'POST',
      headers: {
        'x-api-key': PDFCO_API_KEY,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
    };

    // Use async mode to handle larger documents without timeouts
    const extractionResponse = await makeHttpsRequest(
      extractTextOptions,
      JSON.stringify({
        url: uploadResult.url,
        name: filename,
        async: true, // Enable async processing for larger documents
      })
    );

    console.log(
      `[DEBUG] PDF.co extraction response status: ${extractionResponse.statusCode}`
    );
    if (extractionResponse.error || !extractionResponse.data) {
      console.error('[ERROR] PDF.co extraction request failed:', {
        error: extractionResponse.error,
        statusCode: extractionResponse.statusCode,
        rawResponse: extractionResponse.rawResponse || '(No raw response)',
      });

      if (extractionResponse.statusCode === 402) {
        throw new Error(
          'PDF.co returned Payment Required error. Please check your PDF.co account, credits, or subscription.'
        );
      }

      throw new Error(
        `Failed to process PDF: ${extractionResponse.error || 'Empty response'}`
      );
    }

    // Log the full response to inspect its structure
    console.log(
      '[DEBUG] PDF.co extraction complete response:',
      extractionResponse.data
    );

    // Parse the response
    let responseData;
    try {
      responseData = JSON.parse(extractionResponse.data);
      console.log('[DEBUG] Parsed extraction response:', responseData);
    } catch (parseError) {
      console.error('[ERROR] Failed to parse PDF.co response:', parseError);
      throw new Error(
        `Failed to parse PDF.co response: ${parseError instanceof Error ? parseError.message : String(parseError)}`
      );
    }

    // Check if the response contains an error message
    if (
      responseData.error === true ||
      (typeof responseData.error === 'string' && responseData.error.length > 0)
    ) {
      console.error('[ERROR] PDF.co returned an error:', responseData.error);
      if (
        String(responseData.error).includes('Payment Required') ||
        responseData.status === 402
      ) {
        throw new Error(
          'PDF.co returned Payment Required error. Please check your PDF.co account, credits, or subscription.'
        );
      }
      throw new Error(`PDF.co error: ${responseData.error}`);
    }

    // Handle the asynchronous job response
    if (responseData.jobId) {
      console.log(
        `[DEBUG] PDF.co started async job with ID: ${responseData.jobId}`
      );

      // Poll the job status until it completes or fails
      const jobCheckOptions: HttpsRequestOptions = {
        hostname: PDF_CO_HOSTNAME,
        path: `/v1/job/check?jobId=${responseData.jobId}`,
        method: 'GET',
        headers: {
          'x-api-key': PDFCO_API_KEY,
          Accept: 'application/json',
        },
      };

      // Maximum number of status check attempts
      const MAX_ATTEMPTS = 30;
      // Delay between status checks in milliseconds (start with 2 seconds)
      let pollInterval = 2000;

      // Poll the job status
      for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
        console.log(
          `[DEBUG] Checking job status (attempt ${attempt}/${MAX_ATTEMPTS})...`
        );

        // Wait before checking status
        await new Promise((resolve) => setTimeout(resolve, pollInterval));

        // Check job status
        const jobStatusResponse = await makeHttpsRequest(jobCheckOptions);

        if (jobStatusResponse.error || !jobStatusResponse.data) {
          console.error(
            '[ERROR] Failed to check job status:',
            jobStatusResponse.error
          );
          // Continue polling despite error, as the job might still complete
          continue;
        }

        let jobStatus;
        try {
          jobStatus = JSON.parse(jobStatusResponse.data);
          console.log(`[DEBUG] Job status: ${jobStatus.status}`);
        } catch (parseError) {
          console.error('[ERROR] Failed to parse job status:', parseError);
          continue;
        }

        // Check if job is still running
        if (jobStatus.status === 'working') {
          // Increase polling interval slightly for each attempt (up to 10 seconds)
          pollInterval = Math.min(pollInterval * 1.5, 10000);
          continue;
        }

        // Check if job failed
        if (jobStatus.status === 'failed') {
          throw new Error(
            `PDF.co job failed: ${jobStatus.errorMessage || 'Unknown error'}`
          );
        }

        // Check if job completed successfully
        if (jobStatus.status === 'success' && jobStatus.url) {
          console.log(
            '[DEBUG] PDF.co job completed successfully, fetching result...'
          );
          responseData.url = jobStatus.url;
          break;
        }
      }
    }

    // Handle the response which might contain a URL to fetch the result
    if (responseData.url) {
      console.log(
        '[DEBUG] PDF.co returned a result URL, fetching text content:',
        responseData.url
      );

      // Parse URL to get hostname and path
      const resultUrl = new URL(responseData.url);

      // Create request options for fetching the result
      const resultOptions = {
        method: 'GET',
        hostname: resultUrl.hostname,
        path: resultUrl.pathname + resultUrl.search,
        headers: {},
      };

      // Fetch the result from the provided URL
      const resultResponse = await makeHttpsRequest(resultOptions);

      if (resultResponse.error || !resultResponse.data) {
        throw new Error(
          `Failed to fetch extracted text from result URL: ${resultResponse.error || 'Empty response'}`
        );
      }

      console.log('[DEBUG] Successfully retrieved text content from URL');
      console.log(
        `[DEBUG] Text extraction successful, extracted ${resultResponse.data.length} characters`
      );

      // Log a sample of the extracted text
      if (resultResponse.data.length < 100) {
        console.log(`[DEBUG] Extracted text sample: ${resultResponse.data}`);
      } else {
        console.log(
          `[DEBUG] Extracted text sample: ${resultResponse.data.substring(0, 100)}...`
        );
        console.log(
          `[DEBUG] Extracted text length: ${resultResponse.data.length} characters`
        );

        // Log a larger sample for debugging
        console.log('[DEBUG] Larger extracted text sample:');
        console.log('----------------START OF TEXT SAMPLE----------------');
        console.log(resultResponse.data.substring(0, 1000));
        console.log('----------------END OF TEXT SAMPLE----------------');
      }

      return resultResponse.data; // Return the extracted text
    } else if (responseData.text) {
      // Also support the case where text is directly in the response
      console.log(
        '[DEBUG] Text extraction successful, found text directly in response'
      );
      return responseData.text;
    }

    // If we got here, we didn't get what we expected
    throw new Error(
      'No text content, result URL, or job ID found in PDF.co response'
    );
  } catch (error) {
    console.error('[ERROR] PDF extraction failed:', {
      error: error instanceof Error ? error.message : String(error),
      errorObject: error,
    });
    throw new Error(
      `Failed to extract text from PDF: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Creates the Claude API request options
 * @param apiKey Claude API key
 * @returns HttpsRequestOptions for Claude API
 */
function createClaudeRequestOptions(apiKey: string): HttpsRequestOptions {
  return {
    hostname: 'api.anthropic.com',
    path: '/v1/messages',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
  };
}

/**
 * Creates the payload for the Claude API request
 * @param extractedText Text extracted from the PDF
 * @returns Payload object for the Claude API
 */
function createClaudePayload(extractedText: string): object {
  return {
    model: 'claude-sonnet-4-20250514',
    max_tokens: 8192,
    temperature: 0.1,
    messages: [
      {
        role: 'user',
        content: `${ENHANCED_GEMINI_PROMPT}\n\nHere's the document content to analyze:\n\n${extractedText}`,
      },
    ],
  };
}

/**
 * Processes the Claude API response and extracts the structured data
 * @param responseText Raw text response from Claude API
 * @returns Parsed and validated response data
 */
function processClaudeResponse(responseText: string): ClaudeParsedResponse {
  // Parse the JSON response from Claude
  console.log('[DEBUG] Attempting to parse JSON from Claude response...');
  const parsedJson = extractJsonFromClaudeResponse(responseText);
  if (!parsedJson) {
    console.error('[ERROR] Failed to parse JSON from Claude response');
    // Log the first 500 characters of the response to help diagnose
    console.log(
      `[DEBUG] Failed JSON parsing. Response text sample: ${responseText.substring(0, 500)}...`
    );
    throw new Error('Failed to parse JSON from Claude response');
  }

  // Validate the parsed data - now using allCoverages instead of coverages
  const validationResult = validateCoverages(parsedJson.allCoverages || []);

  // If no valid coverages, create default ones
  let processedCoverages = validationResult.validCoverages;
  if (processedCoverages.length === 0) {
    console.log(
      '[DEBUG] No valid coverages found in Claude response. Creating default coverages.'
    );
    console.log('[DEBUG] Validation result:', validationResult);

    if (parsedJson.allCoverages && parsedJson.allCoverages.length > 0) {
      console.log(
        `[DEBUG] Raw coverages from Claude (${parsedJson.allCoverages.length} items):`
      );
      console.log(JSON.stringify(parsedJson.allCoverages[0], null, 2));
    } else {
      console.log('[DEBUG] No allCoverages array found in Claude response');
    }

    processedCoverages = createDefaultCoverages(parsedJson.metadata);
  } else {
    console.log(
      `[DEBUG] Successfully validated ${processedCoverages.length} coverage(s) from Claude response`
    );
  }

  // Return the structured response with the new schema
  return {
    metadata: parsedJson.metadata,
    planOptions: parsedJson.planOptions,
    allCoverages: processedCoverages,
    documentNotes: parsedJson.documentNotes,
  };
}

/**
 * Structures data from extracted PDF text using Anthropic Claude API
 * @param extractedText Text extracted from the PDF
 * @returns Promise resolving to the structured data
 */
async function structureDataWithClaude(
  extractedText: string
): Promise<ClaudeParsedResponse> {
  if (!CLAUDE_API_KEY) {
    throw new Error('Claude API key is missing');
  }

  try {
    // Prepare and make the request to Claude API
    const claudeOptions = createClaudeRequestOptions(CLAUDE_API_KEY);
    const payload = createClaudePayload(extractedText);

    console.log('[DEBUG] Claude API request payload:', JSON.stringify(payload, null, 2));

    const claudeResponse = await makeHttpsRequest(
      claudeOptions,
      JSON.stringify(payload)
    );

    console.log('[DEBUG] Claude API raw response:', {
      statusCode: claudeResponse.statusCode,
      error: claudeResponse.error,
      dataLength: claudeResponse.data?.length || 0,
      rawResponseSample: claudeResponse.rawResponse?.substring(0, 500) + '...'
    });

    if (claudeResponse.error || !claudeResponse.data) {
      throw new Error(
        `Failed to get response from Claude API: ${claudeResponse.error || 'Empty response'}`
      );
    }

    let responseData: ClaudeSuccessResponse | ClaudeErrorResponse;
    try {
      responseData = JSON.parse(claudeResponse.data);
      console.log('[DEBUG] Parsed Claude API response structure:', {
        hasError: 'error' in responseData,
        hasContent: 'content' in responseData,
        contentLength: 'content' in responseData ? responseData.content?.length : 0,
        model: 'model' in responseData ? responseData.model : 'N/A',
        usage: 'usage' in responseData ? responseData.usage : 'N/A'
      });
      console.log('[DEBUG] Full Claude API response:', JSON.stringify(responseData, null, 2));
    } catch (parseError) {
      console.log('[ERROR] Failed to parse Claude response. Raw data:', claudeResponse.data?.substring(0, 1000));
      throw new Error(
        `Failed to parse Claude API response: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`
      );
    }

    // Check for error in response
    if ('error' in responseData) {
      throw new Error(
        `Claude API error: ${responseData.error.message || 'Unknown error'}`
      );
    }

    // Extract the response text from the Claude API response
    const responseText = responseData.content?.[0]?.text || '';

    if (!responseText) {
      console.log('[ERROR] Empty response text from Claude API. Full response:', JSON.stringify(responseData, null, 2));
      throw new Error('Empty response text from Claude API');
    }

    // Log the complete Claude response text for debugging
    console.log('[DEBUG] Claude response text (FULL):', responseText);
    console.log(
      `[DEBUG] Claude response text sample (first 300 chars): ${responseText.substring(0, 300)}...`
    );
    console.log(`[DEBUG] Claude response text length: ${responseText.length} characters`);

    // Process the response
    return processClaudeResponse(responseText);
  } catch (error) {
    throw new Error(
      `Error structuring data with Claude: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Main handler for the POST request to process document
 */
/**
 * Custom error class to help identify which step of processing failed
 */
class ProcessingError extends Error {
  stage: string;

  constructor(message: string, stage: string) {
    super(message);
    this.name = 'ProcessingError';
    this.stage = stage;
  }
}

/**
 * Process stage information for tracking and reporting
 */
interface ProcessStage {
  id: string;
  name: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  startTime?: string;
  endTime?: string;
  progress?: number; // 0-100
  details?: string;
}

/**
 * Main handler for processing document uploads and extraction
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  // Define processing stages for tracking
  const stages: Record<string, ProcessStage> = {
    authentication: {
      id: 'authentication',
      name: 'Authentication',
      description: 'Verifying user credentials',
      status: 'pending',
    },
    form_validation: {
      id: 'form_validation',
      name: 'Form Validation',
      description: 'Validating uploaded document',
      status: 'pending',
    },
    file_upload: {
      id: 'file_upload',
      name: 'File Upload',
      description: 'Uploading document to secure storage',
      status: 'pending',
    },
    pdf_extraction: {
      id: 'pdf_extraction',
      name: 'PDF Extraction',
      description: 'Extracting text content from PDF',
      status: 'pending',
    },
    ai_processing: {
      id: 'ai_processing',
      name: 'AI Processing',
      description: 'Processing data with Claude AI',
      status: 'pending',
    },
    save_results: {
      id: 'save_results',
      name: 'Saving Results',
      description: 'Saving processed data',
      status: 'pending',
    },
  };

  /**
   * Structured logging utility for process tracking
   * This avoids direct console.log calls while still providing useful logs in development
   */
  const logger = {
    info: (message: string, data?: Record<string, unknown>) => {
      // In production, this could be replaced with proper logging infrastructure
      if (process.env.NODE_ENV !== 'production') {
        // Only log in development and test environments
        // eslint-disable-next-line no-console
        console.log(`[INFO] ${message}`, data ? data : '');
      }
      return message; // Return the message for potential further use
    },
    error: (message: string, data?: Record<string, unknown>) => {
      // Always log errors regardless of environment
      // eslint-disable-next-line no-console
      console.error(`[ERROR] ${message}`, data ? data : '');
      return message;
    },
  };

  // Helper function to update stage status
  const updateStage = (
    stageId: string,
    status: ProcessStage['status'],
    details?: string,
    progress?: number
  ) => {
    if (stages[stageId]) {
      stages[stageId].status = status;
      if (status === 'in_progress' && !stages[stageId].startTime) {
        stages[stageId].startTime = new Date().toISOString();
      } else if (status === 'completed' || status === 'failed') {
        stages[stageId].endTime = new Date().toISOString();
      }
      if (details) {
        stages[stageId].details = details;
      }
      if (progress !== undefined) {
        stages[stageId].progress = progress;
      }
    }

    // Log stage updates with the structured logger
    logger.info(`Process stage updated: ${stageId}`, {
      status,
      details: details || undefined,
      progress: progress !== undefined ? `${progress}%` : undefined,
    });
  };

  try {
    // Authentication stage
    updateStage('authentication', 'in_progress');
    const user = await currentUser();

    if (!user || !user.id) {
      updateStage('authentication', 'failed', 'User not authenticated');
      return NextResponse.json(
        {
          error: 'Authentication error',
          detail: 'Please sign in to upload files',
          suggestedAction: 'Sign in again or refresh your session',
          stages: Object.values(stages),
        },
        { status: 401 }
      );
    }
    updateStage('authentication', 'completed');
    const userId = user.id;

    // Form validation stage
    updateStage('form_validation', 'in_progress');
    // Get form data
    const formData = await request.formData().catch((error) => {
      updateStage(
        'form_validation',
        'failed',
        `Form data parsing error: ${error.message}`
      );
      throw new ProcessingError(
        `Failed to parse form data: ${error.message}`,
        'form_validation'
      );
    });

    const file = formData.get('file');

    if (!file || !(file instanceof File)) {
      updateStage('form_validation', 'failed', 'No file uploaded');
      return NextResponse.json(
        {
          error: 'Missing document',
          detail: 'No file was uploaded',
          suggestedAction: 'Please select a PDF file to upload',
          stages: Object.values(stages),
        },
        { status: 400 }
      );
    }

    // Add additional file validation
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      updateStage('form_validation', 'failed', 'Not a PDF file');
      return NextResponse.json(
        {
          error: 'Invalid file format',
          detail: 'Only PDF files are supported',
          suggestedAction:
            'Please convert your document to PDF format before uploading',
          stages: Object.values(stages),
        },
        { status: 400 }
      );
    }

    // Check file size (10MB limit)
    const TEN_MB = 10 * 1024 * 1024;
    if (file.size > TEN_MB) {
      updateStage('form_validation', 'failed', 'File too large');
      return NextResponse.json(
        {
          error: 'File too large',
          detail: 'Maximum file size is 10MB',
          suggestedAction:
            'Please compress your PDF or split it into smaller files',
          stages: Object.values(stages),
        },
        { status: 400 }
      );
    }
    updateStage('form_validation', 'completed');

    // Convert the file to a buffer
    const fileBuffer = Buffer.from(await file.arrayBuffer());

    // File upload stage
    updateStage('file_upload', 'in_progress');
    // Upload the file to S3 storage first
    const uploadResult = await uploadFile({
      userId,
      file: fileBuffer,
      filename: file.name,
      contentType: file.type || 'application/pdf',
      type: 'upload',
    }).catch((error) => {
      updateStage('file_upload', 'failed', `Upload error: ${error.message}`);
      throw new ProcessingError(
        `Failed to upload file: ${error.message}`,
        'file_upload'
      );
    });
    updateStage('file_upload', 'completed');

    // PDF extraction stage
    updateStage('pdf_extraction', 'in_progress');
    // Extract text from the PDF using PDF.co API
    logger.info('Starting PDF text extraction...');
    let extractedText: string;
    try {
      extractedText = await extractTextFromPdf(fileBuffer);
      updateStage(
        'pdf_extraction',
        'completed',
        `Extracted ${extractedText.length} characters`
      );
      logger.info('PDF text extraction completed successfully');
    } catch (error) {
      updateStage(
        'pdf_extraction',
        'failed',
        `Extraction error: ${error instanceof Error ? error.message : String(error)}`
      );
      logger.error('PDF extraction error in main handler:', {
        error: error instanceof Error ? error.message : String(error),
      });
      throw new ProcessingError(
        `Failed to extract text from PDF: ${error instanceof Error ? error.message : String(error)}`,
        'pdf_extraction'
      );
    }

    // AI processing stage
    updateStage(
      'ai_processing',
      'in_progress',
      'Analyzing document with Claude AI'
    );
    // Process extracted text with Claude API
    const structuredData = await structureDataWithClaude(extractedText).catch(
      (error: Error) => {
        updateStage(
          'ai_processing',
          'failed',
          `AI processing error: ${error.message}`
        );
        throw new ProcessingError(
          `Failed to process with Claude API: ${error.message}`,
          'ai_processing'
        );
      }
    );
    updateStage('ai_processing', 'completed');

    // Save results stage
    updateStage('save_results', 'in_progress');
    // Save the processed data as a JSON file
    const processedData = {
      ...structuredData,
      originalFileUrl: uploadResult.url,
      processedAt: new Date().toISOString(),
      processingStages: Object.values(stages),
    };

    // Save processed data as JSON
    const processedFilename = `${file.name.replace(fileExtensionRegex, '')}-processed.json`;
    
    console.log('[DEBUG] Processed data being saved:', JSON.stringify(processedData, null, 2));
    
    const processedResult = await uploadFile({
      userId,
      file: Buffer.from(JSON.stringify(processedData, null, 2)),
      filename: processedFilename,
      contentType: 'application/json',
      type: 'processed',
    }).catch((error) => {
      updateStage('save_results', 'failed', `Save error: ${error.message}`);
      throw new ProcessingError(
        `Failed to save processed data: ${error.message}`,
        'save_results'
      );
    });
    updateStage('save_results', 'completed');

    // We already have the download URL from the upload result
    const downloadUrl = processedResult.url;

    // Extract metadata and coverages for the top level response
    const {
      metadata: extractedMetadata = {},
      allCoverages: extractedCoverages = [],
    } = structuredData;

    // Count the different coverage types for better feedback
    const coverageTypes = (
      extractedCoverages as Array<{ coverageType?: string }>
    ).reduce(
      (counts: Record<string, number>, coverage) => {
        const type = coverage.coverageType || 'unknown';
        counts[type] = (counts[type] || 0) + 1;
        return counts;
      },
      {} as Record<string, number>
    );

    const coverageCount = extractedCoverages.length;
    const coverageSummary = Object.entries(coverageTypes)
      .map(([type, count]) => `${type}: ${count}`)
      .join(', ');

    // Ensure we use the validated coverages at the top level too
    const finalResponse = {
      success: true,
      processedData,
      url: uploadResult.url,
      downloadUrl,
      originalFileName: file.name,
      category: (formData.get('category') as string) || 'Current',
      metadata: extractedMetadata,
      coverages: extractedCoverages,
      processingStats: {
        processingTime: calculateProcessingTime(stages),
        coverageCount,
        coverageSummary,
        processingStages: Object.values(stages),
      },
      rawJsonContent: JSON.stringify(processedData, null, 2), // Add raw JSON content for display
    };
    
    console.log('[DEBUG] Final API response being returned:', JSON.stringify(finalResponse, null, 2));
    
    return NextResponse.json(finalResponse);
  } catch (error) {
    logger.error('Document processing failed', {
      error: error instanceof Error ? error.message : String(error),
      stage: error instanceof ProcessingError ? error.stage : 'unknown',
    });

    const errorDetails = getErrorMessage(error);
    const errorStage =
      error instanceof ProcessingError ? error.stage : 'unknown';
    const statusCode =
      error instanceof ProcessingError && error.stage === 'authentication'
        ? 401
        : 500;

    return NextResponse.json(
      {
        error: errorDetails.message,
        technicalDetails: errorDetails.technicalDetails,
        suggestedAction: errorDetails.suggestedAction,
        stage: errorStage,
        stages: Object.values(stages),
      },
      { status: statusCode }
    );
  }
}

/**
 * Calculate total processing time from stages
 */
function calculateProcessingTime(stages: Record<string, ProcessStage>): string {
  const allStages = Object.values(stages);
  const startTimes = allStages
    .map((stage) =>
      stage.startTime ? new Date(stage.startTime).getTime() : null
    )
    .filter((time) => time !== null) as number[];

  const endTimes = allStages
    .map((stage) => (stage.endTime ? new Date(stage.endTime).getTime() : null))
    .filter((time) => time !== null) as number[];

  if (startTimes.length === 0 || endTimes.length === 0) {
    return 'Unknown';
  }

  const firstStart = Math.min(...startTimes);
  const lastEnd = Math.max(...endTimes);

  const totalTimeMs = lastEnd - firstStart;
  if (totalTimeMs < 1000) {
    return `${totalTimeMs}ms`;
  }

  if (totalTimeMs < 60000) {
    return `${(totalTimeMs / 1000).toFixed(2)}s`;
  }

  return `${(totalTimeMs / 60000).toFixed(2)}min`;
}

/**
 * Get a specific error message and details based on the error content
 * @param error The error object
 * @returns An object with user-friendly error message, technical details, and suggested actions
 */
function getErrorMessage(error: unknown): {
  message: string;
  technicalDetails: string;
  suggestedAction?: string;
} {
  if (!(error instanceof Error)) {
    return {
      message: 'Failed to process document',
      technicalDetails: String(error) || 'Unknown error occurred',
    };
  }

  const errorMessage = error.message;
  const lowerMessage = errorMessage.toLowerCase();

  // Authentication errors
  if (lowerMessage.includes('auth') || lowerMessage.includes('unauthorized')) {
    return {
      message: 'Authentication error',
      technicalDetails: errorMessage,
      suggestedAction:
        'Please sign in again or contact support if the issue persists.',
    };
  }

  // PDF extraction errors
  if (lowerMessage.includes('pdf-parse') || lowerMessage.includes('pdf')) {
    let suggestedAction =
      'Try a different PDF file or ensure your PDF is not password-protected.';

    // More specific PDF extraction error suggestions
    if (lowerMessage.includes('password') || lowerMessage.includes('encrypt')) {
      suggestedAction =
        'The PDF appears to be password-protected. Please upload an unprotected version.';
    } else if (
      lowerMessage.includes('corrupt') ||
      lowerMessage.includes('invalid format')
    ) {
      suggestedAction =
        'The PDF file appears to be corrupted. Please try recreating or re-exporting the PDF.';
    } else if (lowerMessage.includes('timeout')) {
      suggestedAction =
        'The PDF processing timed out. Try with a smaller or simpler document.';
    }

    return {
      message: 'PDF extraction error',
      technicalDetails: errorMessage,
      suggestedAction,
    };
  }

  // AI processing errors
  if (
    lowerMessage.includes('claude') ||
    lowerMessage.includes('gemini') ||
    lowerMessage.includes('generate') ||
    lowerMessage.includes('ai processing')
  ) {
    let suggestedAction = 'Please try again or try with a different document.';

    // More specific AI errors
    if (lowerMessage.includes('quota') || lowerMessage.includes('rate limit')) {
      suggestedAction =
        'Our AI service is experiencing high demand. Please try again in a few minutes.';
    } else if (
      lowerMessage.includes('content policy') ||
      lowerMessage.includes('content filter')
    ) {
      suggestedAction =
        'The document contains content that could not be processed. Please ensure the document contains only insurance information.';
    } else if (
      lowerMessage.includes('parse') ||
      lowerMessage.includes('json') ||
      lowerMessage.includes('format')
    ) {
      suggestedAction =
        'The document structure could not be properly interpreted. Try with a clearer document layout.';
    }

    return {
      message: 'AI processing error',
      technicalDetails: errorMessage,
      suggestedAction,
    };
  }

  // Storage errors
  if (
    lowerMessage.includes('storage') ||
    lowerMessage.includes('upload') ||
    lowerMessage.includes('s3')
  ) {
    return {
      message: 'File storage error',
      technicalDetails: errorMessage,
      suggestedAction:
        'Please try uploading again. If the problem persists, contact support.',
    };
  }

  // Form data errors
  if (lowerMessage.includes('form') || lowerMessage.includes('data')) {
    return {
      message: 'Invalid form submission',
      technicalDetails: errorMessage,
      suggestedAction: 'Please refresh the page and try again.',
    };
  }

  // Default error handling
  return {
    message: 'Failed to process document',
    technicalDetails: errorMessage,
    suggestedAction:
      'Please try again with a different document or contact support if the issue persists.',
  };
}
