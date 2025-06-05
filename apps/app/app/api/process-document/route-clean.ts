import * as https from 'node:https';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

import { ENHANCED_GEMINI_PROMPT } from './gemini-prompt-enhanced';

// API Keys from environment variables
const PDFCO_API_KEY = process.env['PDF_UPLOAD_SECRET'];
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// Define the regex at the module level to avoid performance issues
const jsonBlockRegex = /```(?:json)?\s*([\s\S]*?)\s*```/;

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

// Options for HTTPS requests
interface HttpsRequestOptions {
  hostname: string;
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
        try {
          resolve({
            statusCode: res.statusCode,
            data: responseData,
            rawResponse: responseData,
          });
        } catch (error) {
          resolve({
            statusCode: res.statusCode,
            error: error instanceof Error ? error.message : 'Unknown error',
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
    if (match && match[1]) {
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
 * Extracts text from a PDF document using PDF.co API
 * @param fileBuffer The PDF file buffer
 * @returns Promise resolving to the extracted text
 */
async function extractTextFromPdf(fileBuffer: Buffer): Promise<string> {
  if (!PDFCO_API_KEY) {
    throw new Error('PDF.co API key is missing');
  }

  try {
    // Step 1: Get presigned URL for PDF upload
    const getPresignedUrlOptions: HttpsRequestOptions = {
      hostname: 'api.pdf.co',
      path: `/v1/pdf/convert/to/text?name=result.txt&async=true`,
      method: 'POST',
      headers: {
        'x-api-key': PDFCO_API_KEY,
        'Content-Type': 'application/json',
      },
    };

    const getPresignedUrlResponse = await makeHttpsRequest(
      getPresignedUrlOptions,
      JSON.stringify({ url: 'https://placeholderurl.com/dummy.pdf' })
    );

    if (getPresignedUrlResponse.error || !getPresignedUrlResponse.data) {
      throw new Error(
        `Failed to get presigned URL: ${getPresignedUrlResponse.error || 'Empty response'}`
      );
    }

    const presignedUrlData = JSON.parse(getPresignedUrlResponse.data);
    const { presignedUrl, url } = presignedUrlData;

    if (!presignedUrl || !url) {
      throw new Error('Invalid response when requesting presigned URL');
    }

    // Step 2: Upload PDF to the presigned URL
    const uploadUrl = new URL(presignedUrl);
    const uploadOptions: HttpsRequestOptions = {
      hostname: uploadUrl.hostname,
      path: uploadUrl.pathname + uploadUrl.search,
      method: 'PUT',
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Length': fileBuffer.length.toString(),
      },
    };

    const uploadResponse = await makeHttpsRequest(
      uploadOptions,
      fileBuffer.toString('binary')
    );

    if (uploadResponse.error) {
      throw new Error(`Failed to upload PDF: ${uploadResponse.error}`);
    }

    // Step 3: Process the uploaded PDF
    const processOptions: HttpsRequestOptions = {
      hostname: 'api.pdf.co',
      path: `/v1/pdf/convert/to/text?url=${encodeURIComponent(url)}&async=false`,
      method: 'POST',
      headers: {
        'x-api-key': PDFCO_API_KEY,
      },
    };

    const processResponse = await makeHttpsRequest(processOptions);

    if (processResponse.error || !processResponse.data) {
      throw new Error(
        `Failed to process PDF: ${processResponse.error || 'Empty response'}`
      );
    }

    const processData = JSON.parse(processResponse.data);

    if (!processData.url) {
      throw new Error('No URL for processed text in the response');
    }

    // Step 4: Download the extracted text
    const textUrl = new URL(processData.url);
    const downloadOptions: HttpsRequestOptions = {
      hostname: textUrl.hostname,
      path: textUrl.pathname + textUrl.search,
      method: 'GET',
      headers: {},
    };

    const downloadResponse = await makeHttpsRequest(downloadOptions);

    if (downloadResponse.error || !downloadResponse.data) {
      throw new Error(
        `Failed to download extracted text: ${downloadResponse.error || 'Empty response'}`
      );
    }

    return downloadResponse.data;
  } catch (error) {
    console.error('Error extracting text from PDF:', error);
    throw error;
  }
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
    // Prepare the request for Gemini API
    const geminiOptions: HttpsRequestOptions = {
      hostname: 'generativelanguage.googleapis.com',
      path: `/v1beta/models/gemini-2.5-pro-preview-05-06:generateContent?key=${GEMINI_API_KEY}`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    };

    // Build the request payload for Gemini API
    const payload = {
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

    // Make the request to Gemini API
    const geminiResponse = await makeHttpsRequest(
      geminiOptions,
      JSON.stringify(payload)
    );

    if (geminiResponse.error || !geminiResponse.data) {
      throw new Error(
        `Failed to get response from Gemini API: ${geminiResponse.error || 'Empty response'}`
      );
    }

    let responseData;
    try {
      responseData = JSON.parse(geminiResponse.data);
    } catch (err) {
      throw new Error(`Failed to parse Gemini API response: ${err}`);
    }

    // Check for errors in the Gemini API response
    if ((responseData as GeminiErrorResponse).error) {
      const errorResponse = responseData as GeminiErrorResponse;
      throw new Error(`Gemini API error: ${errorResponse.error.message}`);
    }

    // Process the successful response
    const successResponse = responseData as GeminiSuccessResponse;
    if (
      !successResponse.candidates ||
      !successResponse.candidates.length ||
      !successResponse.candidates[0].content
    ) {
      throw new Error('No valid content in Gemini API response');
    }

    // Get the text from the response
    const candidateContent = successResponse.candidates[0].content;
    if (
      !candidateContent.parts ||
      !candidateContent.parts.length ||
      !candidateContent.parts[0].text
    ) {
      throw new Error('No text content in Gemini API response');
    }

    const responseText = candidateContent.parts[0].text;

    // Extract and parse the JSON from the response text
    const parsedJson = extractJsonFromGeminiResponse(responseText);
    if (!parsedJson) {
      throw new Error('Failed to extract JSON from Gemini response');
    }

    // Validate coverages
    const validationResult = validateCoverages(parsedJson.coverages || []);
    console.log(
      `Validated coverages: ${validationResult.validCount} valid, ${validationResult.invalidCount} invalid`
    );

    // If no valid coverages, create default ones
    let processedCoverages = validationResult.validCoverages;
    if (processedCoverages.length === 0) {
      console.warn('No valid coverages found, creating default coverages');
      processedCoverages = createDefaultCoverages(parsedJson.metadata);
    }

    // Return the structured response
    return {
      metadata: parsedJson.metadata,
      coverages: processedCoverages,
      planNotes: parsedJson.planNotes,
    };
  } catch (error) {
    console.error('Error structuring data with Gemini:', error);
    throw error;
  }
}

/**
 * Main handler for the POST request to process document
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // Parse the form data from the request
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Convert the file to a buffer
    const buffer = Buffer.from(await file.arrayBuffer());

    // Extract text from PDF
    const extractedText = await extractTextFromPdf(buffer);

    // Structure the extracted data with Gemini API
    const structuredData = await structureDataWithGemini(extractedText);

    // Return the structured data
    return NextResponse.json(structuredData);
  } catch (error) {
    console.error('Error processing document:', error);

    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : 'An unknown error occurred',
      },
      { status: 500 }
    );
  }
}
