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
  carrierName?: string;
  effectiveDate?: string;
  quoteDate?: string;
  policyNumber?: string;
  planOptionName?: string;
  totalProposedMonthlyPlanPremium?: number;
  planOptionTotals?: PlanOptionTotal[];
  rateGuarantees?: RateGuarantee[];
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
  coverages?: CoverageEntry[];
  planNotes?: PlanNote[];
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
): GeminiParsedResponse | null {
  try {
    // First, try to extract JSON from code blocks using regex
    const match = text.match(jsonBlockRegex);
    if (match?.[1]) {
      try {
        return JSON.parse(match[1]);
      } catch (e) {
        console.warn('Failed to parse JSON from code block:', e);
      }
    }

    // If no code block or parsing failed, try to parse the entire text as JSON
    try {
      return JSON.parse(text);
    } catch (e) {
      console.warn('Failed to parse entire text as JSON:', e);
    }

    return null;
  } catch (error) {
    console.error('Error extracting JSON from Gemini response:', error);
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
    if (
      !coverage.coverageType ||
      !coverage.carrierName ||
      !coverage.planOptionName ||
      typeof coverage.premium !== 'number' ||
      typeof coverage.monthlyPremium !== 'number' ||
      typeof coverage.unitRate !== 'number' ||
      !coverage.unitRateBasis ||
      typeof coverage.volume !== 'number' ||
      typeof coverage.lives !== 'number' ||
      !coverage.benefitDetails
    ) {
      console.warn('Invalid coverage entry:', coverage);
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
  const defaultCoverage: CoverageEntry = {
    coverageType: 'Unknown',
    carrierName: metadata?.carrierName || 'Unknown Carrier',
    planOptionName: metadata?.planOptionName || 'Default Plan',
    premium: metadata?.totalProposedMonthlyPlanPremium || 0,
    monthlyPremium: metadata?.totalProposedMonthlyPlanPremium || 0,
    unitRate: 0,
    unitRateBasis: 'Unknown',
    volume: 0,
    lives: 0,
    benefitDetails: {
      note: 'Default coverage created as no valid coverages were found in the document.',
    },
  };

  return [defaultCoverage];
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
      throw new Error('File does not appear to be a valid PDF (missing %PDF header)');
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
      type: 'upload'
    });
    
    console.log(`[DEBUG] File uploaded to DigitalOcean Spaces: ${uploadResult.url}`);
    
    // Now send the URL to PDF.co for text extraction
    console.log('[DEBUG] Sending URL to PDF.co for text extraction...');
    
    const extractTextOptions: HttpsRequestOptions = {
      hostname: PDF_CO_HOSTNAME,
      path: '/v1/pdf/convert/to/text',
      method: 'POST',
      headers: {
        'x-api-key': PDFCO_API_KEY,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    };
    
    const extractionResponse = await makeHttpsRequest(
      extractTextOptions,
      JSON.stringify({
        url: uploadResult.url,
        name: filename,
        async: false
      })
    );

    console.log(`[DEBUG] PDF.co extraction response status: ${extractionResponse.statusCode}`);
    if (extractionResponse.error || !extractionResponse.data) {
      console.error('[ERROR] PDF.co extraction request failed:', {
        error: extractionResponse.error,
        statusCode: extractionResponse.statusCode,
        rawResponse: extractionResponse.rawResponse || '(No raw response)'
      });
      
      if (extractionResponse.statusCode === 402) {
        throw new Error('PDF.co returned Payment Required error. Please check your PDF.co account, credits, or subscription.');
      }
      
      throw new Error(`Failed to process PDF: ${extractionResponse.error || 'Empty response'}`);
    }
    
    // Log the full response to inspect its structure
    console.log('[DEBUG] PDF.co extraction complete response:', extractionResponse.data);

    // Parse the response
    let responseData;
    try {
      responseData = JSON.parse(extractionResponse.data);
      console.log('[DEBUG] Parsed extraction response:', responseData);
    } catch (parseError) {
      console.error('[ERROR] Failed to parse PDF.co response:', parseError);
      throw new Error(`Failed to parse PDF.co response: ${parseError instanceof Error ? parseError.message : String(parseError)}`);
    }
    
    // Check if the response contains an error message
    if (responseData.error === true || (typeof responseData.error === 'string' && responseData.error.length > 0)) {
      console.error('[ERROR] PDF.co returned an error:', responseData.error);
      if (String(responseData.error).includes('Payment Required') || responseData.status === 402) {
        throw new Error('PDF.co returned Payment Required error. Please check your PDF.co account, credits, or subscription.');
      }
      throw new Error(`PDF.co error: ${responseData.error}`);
    }
    
    // Handle the response which might contain text directly or provide a URL to fetch the result
    if (responseData.url) {
      console.log('[DEBUG] PDF.co returned a result URL, fetching text content:', responseData.url);
      
      // Parse URL to get hostname and path
      const resultUrl = new URL(responseData.url);
      
      // Create request options for fetching the result
      const resultOptions = {
        method: 'GET',
        hostname: resultUrl.hostname,
        path: resultUrl.pathname + resultUrl.search,
        headers: {}
      };
      
      // Fetch the result from the provided URL
      const resultResponse = await makeHttpsRequest(resultOptions);
      
      if (resultResponse.error || !resultResponse.data) {
        throw new Error(`Failed to fetch extracted text from result URL: ${resultResponse.error || 'Empty response'}`);
      }
      
      console.log('[DEBUG] Successfully retrieved text content from URL');
      console.log(`[DEBUG] Text extraction successful, extracted ${resultResponse.data.length} characters`);
      
      // Log a sample of the extracted text
      if (resultResponse.data.length < 100) {
        console.log(`[DEBUG] Extracted text sample: ${resultResponse.data}`);
      } else {
        console.log(`[DEBUG] Extracted text sample: ${resultResponse.data.substring(0, 100)}...`);
      }
      
      return resultResponse.data; // Return the extracted text
    } else if (responseData.text) {
      // Also support the case where text is directly in the response
      console.log('[DEBUG] Text extraction successful, found text directly in response');
      return responseData.text;
    }
    
    // If we got here, we didn't get what we expected
    throw new Error('No text content or result URL found in PDF.co response');
    
  } catch (error) {
    console.error('[ERROR] PDF extraction failed:', {
      error: error instanceof Error ? error.message : String(error),
      errorObject: error
    });
    throw new Error(`Failed to extract text from PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
    path: `/v1beta/models/gemini-2.5-pro-preview-05-06:generateContent?key=${apiKey}`,
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
function processGeminiResponse(responseText: string): GeminiParsedResponse {
  // Parse the JSON response from Gemini
  const parsedJson = extractJsonFromGeminiResponse(responseText);
  if (!parsedJson) {
    throw new Error('Failed to parse JSON from Gemini response');
  }

  // Validate the parsed data
  const validationResult = validateCoverages(parsedJson.coverages || []);

  // If no valid coverages, create default ones
  let processedCoverages = validationResult.validCoverages;
  if (processedCoverages.length === 0) {
    processedCoverages = createDefaultCoverages(parsedJson.metadata);
  }

  // Return the structured response
  return {
    metadata: parsedJson.metadata,
    coverages: processedCoverages,
    planNotes: parsedJson.planNotes,
  };
}

/**
 * Structures data from extracted PDF text using Google Gemini API
 * @param extractedText Text extracted from the PDF
 * @returns Promise resolving to the structured data
 */
async function structureDataWithGemini(
  extractedText: string
): Promise<GeminiParsedResponse> {
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

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // Get the authenticated user
    const user = await currentUser();

    if (!user || !user.id) {
      return NextResponse.json(
        { error: 'Unauthorized - Please sign in to upload files' },
        { status: 401 }
      );
    }

    const userId = user.id;

    // Get form data
    const formData = await request.formData().catch((error) => {
      throw new ProcessingError(
        `Failed to parse form data: ${error.message}`,
        'form_data'
      );
    });

    const file = formData.get('file');

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    // Add additional file validation
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      return NextResponse.json(
        {
          error: 'Invalid file format',
          details: 'Only PDF files are supported',
        },
        { status: 400 }
      );
    }

    // Check file size (10MB limit)
    const TEN_MB = 10 * 1024 * 1024;
    if (file.size > TEN_MB) {
      return NextResponse.json(
        { error: 'File too large', details: 'Maximum file size is 10MB' },
        { status: 400 }
      );
    }

    // Convert the file to a buffer
    const fileBuffer = Buffer.from(await file.arrayBuffer());

    // Upload the file to S3 storage first
    const uploadResult = await uploadFile({
      userId,
      file: fileBuffer,
      filename: file.name,
      contentType: file.type || 'application/pdf',
      type: 'upload',
    }).catch((error) => {
      throw new ProcessingError(
        `Failed to upload file: ${error.message}`,
        'file_upload'
      );
    });

    // Extract text from the PDF using PDF.co API
    console.log('[INFO] Starting PDF text extraction...');
    let extractedText;
    try {
      extractedText = await extractTextFromPdf(fileBuffer);
      console.log('[INFO] PDF text extraction completed successfully');
    } catch (error) {
      console.error('[ERROR] PDF extraction error in main handler:', {
        error: error instanceof Error ? error.message : String(error),
      });
      throw new ProcessingError(
        `Failed to extract text from PDF: ${error instanceof Error ? error.message : String(error)}`,
        'pdf_extraction'
      );
    }

    // Process extracted text with Gemini API
    const structuredData = await structureDataWithGemini(extractedText).catch(
      (error) => {
        throw new ProcessingError(
          `Failed to process with Gemini API: ${error.message}`,
          'ai_processing'
        );
      }
    );

    // Save the processed data as a JSON file
    const processedData = {
      ...structuredData,
      originalFileUrl: uploadResult.url,
      processedAt: new Date().toISOString(),
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
      throw new ProcessingError(
        `Failed to save processed data: ${error.message}`,
        'save_results'
      );
    });

    // We already have the download URL from the upload result
    const downloadUrl = processedResult.url;

    return NextResponse.json({
      success: true,
      processedData,
      url: uploadResult.url,
      downloadUrl,
    });
  } catch (error) {
    console.error('[ERROR] Document processing failed:', {
      error: error instanceof Error ? error.message : String(error),
      stage: error instanceof ProcessingError ? error.stage : 'unknown'
    });
    
    const errorMessage = getErrorMessage(error);
    const errorStage =
      error instanceof ProcessingError ? error.stage : 'unknown';
    const statusCode =
      error instanceof ProcessingError && error.stage === 'authentication'
        ? 401
        : 500;

    return NextResponse.json(
      {
        error: errorMessage,
        stage: errorStage,
        details: error instanceof Error ? error.message : String(error)
      },
      { status: statusCode }
    );
  }
}

/**
 * Get a specific error message based on the error content
 */
function getErrorMessage(error: unknown): string {
  if (!(error instanceof Error)) {
    return 'Failed to process document';
  }

  const message = error.message.toLowerCase();

  if (message.includes('auth')) {
    return 'Authentication error';
  }
  if (message.includes('pdf-parse') || message.includes('pdf')) {
    return 'PDF extraction error';
  }
  if (message.includes('gemini') || message.includes('generate')) {
    return 'AI processing error';
  }
  if (message.includes('storage') || message.includes('upload')) {
    return 'File storage error';
  }

  return 'Failed to process document';
}
