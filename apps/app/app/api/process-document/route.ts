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
import { ENHANCED_GEMINI_PROMPT } from './gemini-prompt-enhanced';

// API Keys from environment variables (only define what's used)
const PDFCO_API_KEY = process.env.PDF_UPLOAD_SECRET;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

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

// Structure of the parsed response from Gemini API
interface GeminiParsedResponse {
  metadata?: Metadata;
  planOptions?: PlanOption[];
  allCoverages?: CoverageEntry[];
  documentNotes?: string[];
}

// NEW - Enhanced JSON structure types (add support without breaking existing)
interface HighLevelOverview {
  carrierName: string;
  planOption: string;
  totalMonthlyPremium: number;
  rateGuarantee: string;
  pooledBenefitsSubtotal: number;
  experienceRatedSubtotal: number;
  keyHighlights: string;
}

interface GranularBreakdown {
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
interface EnhancedGeminiResponse {
  // Old format (backward compatibility)
  metadata?: Metadata;
  planOptions?: PlanOption[];
  allCoverages?: CoverageEntry[];
  documentNotes?: string[];
  // New format
  highLevelOverview?: HighLevelOverview[];
  granularBreakdown?: GranularBreakdown[];
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

// Gemini API error response
interface GeminiErrorResponse {
  error: {
    code: number;
    message: string;
    status: string;
  };
}

// Gemini API success response
interface GeminiSuccessResponse {
  candidates: {
    content: {
      parts: {
        text: string;
      }[];
    };
    finishReason: string;
    safetyRatings: {
      category: string;
      probability: string;
    }[];
  }[];
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
 * Extract JSON from a Gemini API response text, handling markdown code blocks
 * @param text The response text from Gemini API
 * @returns Parsed JSON object or null if parsing fails
 */
function extractJsonFromGeminiResponse(
  text: string
): EnhancedGeminiResponse | null {
  try {
    // First, try to extract JSON from code blocks using regex
    const match = text.match(jsonBlockRegex);
    if (match?.[1]) {
      try {
        return JSON.parse(match[1]);
      } catch (e) {
        // Failed to parse JSON from code block
      }
    }

    // If no code block or parsing failed, try to parse the entire text as JSON
    try {
      return JSON.parse(text);
    } catch (e) {
      // Failed to parse entire text as JSON
    }

    return null;
  } catch (error) {
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
 * @param metadata Metadata from the Gemini API response
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
    const isPdfHeader = fileBuffer.subarray(0, 4).toString() === '%PDF';
    if (!isPdfHeader) {
      throw new Error(
        'File does not appear to be a valid PDF (missing %PDF header)'
      );
    }

    // First upload the file to DigitalOcean Spaces

    // Generate a unique filename for this upload
    const timestamp = Date.now();
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

    // Now send the URL to PDF.co for text extraction

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

    if (extractionResponse.error || !extractionResponse.data) {

      if (extractionResponse.statusCode === 402) {
        throw new Error(
          'PDF.co returned Payment Required error. Please check your PDF.co account, credits, or subscription.'
        );
      }

      throw new Error(
        `Failed to process PDF: ${extractionResponse.error || 'Empty response'}`
      );
    }

    // Parse the response
    let responseData: any;
    try {
      responseData = JSON.parse(extractionResponse.data);
    } catch (parseError) {
      throw new Error(
        `Failed to parse PDF.co response: ${parseError instanceof Error ? parseError.message : String(parseError)}`
      );
    }

    // Check if the response contains an error message
    if (
      responseData.error === true ||
      (typeof responseData.error === 'string' && responseData.error.length > 0)
    ) {
      // PDF.co returned an error
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
        // Wait before checking status
        await new Promise((resolve) => setTimeout(resolve, pollInterval));

        // Check job status
        const jobStatusResponse = await makeHttpsRequest(jobCheckOptions);

        if (jobStatusResponse.error || !jobStatusResponse.data) {
          continue;
        }

        let jobStatus: any;
        try {
          jobStatus = JSON.parse(jobStatusResponse.data);
        } catch (parseError) {
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
          responseData.url = jobStatus.url;
          break;
        }
      }
    }

    // Handle the response which might contain a URL to fetch the result
    if (responseData.url) {
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

      return resultResponse.data; // Return the extracted text
    } 
    
    if (responseData.text) {
      return responseData.text;
    }

    // If we got here, we didn't get what we expected
    throw new Error(
      'No text content, result URL, or job ID found in PDF.co response'
    );
  } catch (error) {
    throw new Error(
      `Failed to extract text from PDF: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Creates the Gemini API request options
 * @param apiKey Gemini API key
 * @returns HttpsRequestOptions for Gemini API
 */
function createGeminiRequestOptions(apiKey: string): HttpsRequestOptions {
  return {
    hostname: 'generativelanguage.googleapis.com',
    path: `/v1beta/models/gemini-2.5-pro-preview-06-05:generateContent?key=${apiKey}`,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
  };
}

/**
 * Creates the payload for the Gemini API request
 * @param extractedText Text extracted from the PDF
 * @returns Payload object for the Gemini API
 */
function createGeminiPayload(extractedText: string): object {
  return {
    contents: [
      {
        parts: [
          {
            text: `${ENHANCED_GEMINI_PROMPT}\n\nHere's the document content to analyze:\n\n${extractedText}`,
          },
        ],
      },
    ],
    generationConfig: {
      temperature: 0.1,
      topK: 40,
      topP: 0.95,
      maxOutputTokens: 58192,
      responseMimeType: 'text/plain',
    },
  };
}

/**
 * Processes the Gemini API response and extracts the structured data
 * @param responseText Raw text response from Gemini API
 * @returns Parsed and validated response data
 */
function processGeminiResponse(responseText: string): EnhancedGeminiResponse {
  // Parse the JSON response from Gemini
  const parsedJson = extractJsonFromGeminiResponse(responseText);
  if (!parsedJson) {
    // Failed JSON parsing
    throw new Error('Failed to parse JSON from Gemini response');
  }

  // Check if this is the new enhanced format
  const hasNewFormat = parsedJson.highLevelOverview && parsedJson.granularBreakdown;
  
  if (hasNewFormat) {
    // Validate the new format
    if (!Array.isArray(parsedJson.highLevelOverview) || !Array.isArray(parsedJson.granularBreakdown)) {
      throw new Error('Invalid new format: highLevelOverview and granularBreakdown must be arrays');
    }
    
    return parsedJson;
  }
  
  // Handle legacy format
  const validationResult = validateCoverages(parsedJson.allCoverages || []);

  // If no valid coverages, create default ones
  let processedCoverages = validationResult.validCoverages;
  if (processedCoverages.length === 0) {
    processedCoverages = createDefaultCoverages(parsedJson.metadata);
  }

  // Return the structured response with legacy format
  return {
    metadata: parsedJson.metadata,
    planOptions: parsedJson.planOptions,
    allCoverages: processedCoverages,
    documentNotes: parsedJson.documentNotes,
  };
}

/**
 * Structures data from extracted PDF text using Google Gemini API
 * @param extractedText Text extracted from the PDF
 * @returns Promise resolving to the structured data
 */
async function structureDataWithGemini(
  extractedText: string
): Promise<EnhancedGeminiResponse> {
  if (!GEMINI_API_KEY) {
    throw new Error('Gemini API key is missing');
  }

  try {
    // Prepare and make the request to Gemini API
    const geminiOptions = createGeminiRequestOptions(GEMINI_API_KEY);
    const payload = createGeminiPayload(extractedText);

    const geminiResponse = await makeHttpsRequest(
      geminiOptions,
      JSON.stringify(payload)
    );

    if (geminiResponse.error || !geminiResponse.data) {
      throw new Error(
        `Failed to get response from Gemini API: ${geminiResponse.error || 'Empty response'}`
      );
    }

    let responseData: GeminiSuccessResponse | GeminiErrorResponse;
    try {
      responseData = JSON.parse(geminiResponse.data);
    } catch (parseError) {
      throw new Error(
        `Failed to parse Gemini API response: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`
      );
    }

    // Check for error in response
    if ('error' in responseData) {
      throw new Error(
        `Gemini API error: ${responseData.error.message || 'Unknown error'}`
      );
    }

    // Extract the response text from the Gemini API response
    const responseText =
      responseData.candidates?.[0]?.content?.parts?.[0]?.text || '';

    if (!responseText) {
      throw new Error('Empty response text from Gemini API');
    }

    // Process the response
    return processGeminiResponse(responseText);
  } catch (error) {
    throw new Error(
      `Error structuring data with Gemini: ${error instanceof Error ? error.message : 'Unknown error'}`
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
      status: 'pending'
    },
    form_validation: {
      id: 'form_validation',
      name: 'Form Validation', 
      description: 'Validating uploaded document',
      status: 'pending'
    },
    file_upload: {
      id: 'file_upload',
      name: 'File Upload',
      description: 'Uploading document to secure storage',
      status: 'pending'
    },
    pdf_extraction: {
      id: 'pdf_extraction',
      name: 'PDF Extraction',
      description: 'Extracting text content from PDF',
      status: 'pending'
    },
    ai_processing: {
      id: 'ai_processing',
      name: 'AI Processing',
      description: 'Processing data with Gemini AI',
      status: 'pending'
    },
    save_results: {
      id: 'save_results',
      name: 'Saving Results',
      description: 'Saving processed data',
      status: 'pending'
    }
  };


  // Helper function to update stage status
  const updateStage = (stageId: string, status: ProcessStage['status'], details?: string, progress?: number) => {
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
          stages: Object.values(stages)
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
      updateStage('form_validation', 'failed', `Form data parsing error: ${error.message}`);
      throw new ProcessingError(
        `Failed to parse form data: ${error.message}`,
        'form_validation'
      );
    });

    const file = formData.get('file');

    if (!file || !(file instanceof File)) {
      updateStage('form_validation', 'failed', 'No file uploaded');
      return NextResponse.json({ 
        error: 'Missing document', 
        detail: 'No file was uploaded',
        suggestedAction: 'Please select a PDF file to upload',
        stages: Object.values(stages)
      }, { status: 400 });
    }

    // Add additional file validation
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      updateStage('form_validation', 'failed', 'Not a PDF file');
      return NextResponse.json(
        {
          error: 'Invalid file format',
          detail: 'Only PDF files are supported',
          suggestedAction: 'Please convert your document to PDF format before uploading',
          stages: Object.values(stages)
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
          suggestedAction: 'Please compress your PDF or split it into smaller files',
          stages: Object.values(stages)
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
    let extractedText: string;
    try {
      extractedText = await extractTextFromPdf(fileBuffer);
      updateStage('pdf_extraction', 'completed', `Extracted ${extractedText.length} characters`);
    } catch (error) {
      updateStage('pdf_extraction', 'failed', `Extraction error: ${error instanceof Error ? error.message : String(error)}`);
      throw new ProcessingError(
        `Failed to extract text from PDF: ${error instanceof Error ? error.message : String(error)}`,
        'pdf_extraction'
      );
    }

    // AI processing stage
    updateStage('ai_processing', 'in_progress', 'Analyzing document with Gemini AI');
    // Process extracted text with Gemini API
    const structuredData = await structureDataWithGemini(extractedText).catch(
      (error) => {
        updateStage('ai_processing', 'failed', `AI processing error: ${error.message}`);
        throw new ProcessingError(
          `Failed to process with Gemini API: ${error.message}`,
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
      processingStages: Object.values(stages)
    };

    // Save processed data as JSON
    const processedFilename = `${file.name.replace(fileExtensionRegex, '')}-processed.json`;
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

    // Handle both old and new format responses
    const hasNewFormat = structuredData.highLevelOverview && structuredData.granularBreakdown;
    
    if (hasNewFormat) {
      // New enhanced format
      return NextResponse.json({
        success: true,
        processedData: structuredData, // Contains highLevelOverview and granularBreakdown
        url: uploadResult.url,
        downloadUrl,
        originalFileName: file.name,
        category: (formData.get('category') as string) || 'Current',
        processingStats: {
          processingTime: calculateProcessingTime(stages),
          overviewCount: structuredData.highLevelOverview?.length || 0,
          granularCount: structuredData.granularBreakdown?.length || 0,
          processingStages: Object.values(stages)
        }
      });
    }
    
    const {
      metadata: extractedMetadata = {},
      allCoverages: extractedCoverages = [],
    } = structuredData;
    
    // Count the different coverage types for better feedback
    const coverageTypes = (extractedCoverages as Array<{coverageType?: string}>).reduce((counts: Record<string, number>, coverage) => {
      const type = coverage.coverageType || 'unknown';
      counts[type] = (counts[type] || 0) + 1;
      return counts;
    }, {} as Record<string, number>);
    
    const coverageCount = extractedCoverages.length;
    const coverageSummary = Object.entries(coverageTypes)
      .map(([type, count]) => `${type}: ${count}`)
      .join(', ');

    return NextResponse.json({
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
        processingStages: Object.values(stages)
      }
    });
    
  } catch (error) {

    const errorDetails = getErrorMessage(error);
    const errorStage = error instanceof ProcessingError ? error.stage : 'unknown';
    const statusCode = error instanceof ProcessingError && error.stage === 'authentication' ? 401 : 500;

    return NextResponse.json(
      {
        error: errorDetails.message,
        technicalDetails: errorDetails.technicalDetails,
        suggestedAction: errorDetails.suggestedAction,
        stage: errorStage,
        stages: Object.values(stages)
      },
      { status: statusCode }
    );
}

/**
 * Calculate total processing time from stages
 */
function calculateProcessingTime(stages: Record<string, ProcessStage>): string {
  const allStages = Object.values(stages);
  const startTimes = allStages
    .map(stage => stage.startTime ? new Date(stage.startTime).getTime() : null)
    .filter(time => time !== null) as number[];
  
  const endTimes = allStages
    .map(stage => stage.endTime ? new Date(stage.endTime).getTime() : null)
    .filter(time => time !== null) as number[];
  
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
      suggestedAction: 'Please sign in again or contact support if the issue persists.',
    };
  }

  // PDF extraction errors
  if (lowerMessage.includes('pdf-parse') || lowerMessage.includes('pdf')) {
    let suggestedAction = 'Try a different PDF file or ensure your PDF is not password-protected.';
    
    // More specific PDF extraction error suggestions
    if (lowerMessage.includes('password') || lowerMessage.includes('encrypt')) {
      suggestedAction = 'The PDF appears to be password-protected. Please upload an unprotected version.';
    } else if (lowerMessage.includes('corrupt') || lowerMessage.includes('invalid format')) {
      suggestedAction = 'The PDF file appears to be corrupted. Please try recreating or re-exporting the PDF.';
    } else if (lowerMessage.includes('timeout')) {
      suggestedAction = 'The PDF processing timed out. Try with a smaller or simpler document.';
    }
    
    return {
      message: 'PDF extraction error',
      technicalDetails: errorMessage,
      suggestedAction,
    };
  }

  // AI processing errors
  if (lowerMessage.includes('gemini') || lowerMessage.includes('generate') || lowerMessage.includes('ai processing')) {
    let suggestedAction = 'Please try again or try with a different document.';
    
    // More specific AI errors
    if (lowerMessage.includes('quota') || lowerMessage.includes('rate limit')) {
      suggestedAction = 'Our AI service is experiencing high demand. Please try again in a few minutes.';
    } else if (lowerMessage.includes('content policy') || lowerMessage.includes('content filter')) {
      suggestedAction = 'The document contains content that could not be processed. Please ensure the document contains only insurance information.';
    } else if (lowerMessage.includes('parse') || lowerMessage.includes('json') || lowerMessage.includes('format')) {
      suggestedAction = 'The document structure could not be properly interpreted. Try with a clearer document layout.';
    }
    
    return {
      message: 'AI processing error',
      technicalDetails: errorMessage,
      suggestedAction,
    };
  }

  // Storage errors
  if (lowerMessage.includes('storage') || lowerMessage.includes('upload') || lowerMessage.includes('s3')) {
    return {
      message: 'File storage error',
      technicalDetails: errorMessage,
      suggestedAction: 'Please try uploading again. If the problem persists, contact support.',
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
    suggestedAction: 'Please try again with a different document or contact support if the issue persists.',
  };
}

}
