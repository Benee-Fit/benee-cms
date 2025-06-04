import { NextRequest, NextResponse } from 'next/server';
import https from 'https';

// API Keys from environment variables
const PDFCO_API_KEY = process.env['PDF-UPLOAD-SECRET'];
const GEMINI_API_KEY = process.env['GEMINI_API_KEY'];

// Detailed prompt template for Gemini API
const GEMINI_PROMPT_TEMPLATE = `
You are an expert insurance document parser for benefits brokers. 
Extract all relevant information from this insurance document text into a JSON structure.

IMPORTANT INSTRUCTIONS:
Output MUST be a valid JSON object only. Do not include any explanatory text or code markdown.

The JSON object must have three top-level properties: "metadata", "coverages" (array), and "planNotes" (array).

1. **METADATA (object):**
   * documentType: (string) e.g., "Group Insurance Quote", "Renewal Report", "Market Analysis"
   * clientName: (string) The name of the client company or organization.
   * carrierName: (string) The name of the insurance carrier that provided this document.
   * effectiveDate: (string) YYYY-MM-DD format. Date the policy or quote becomes effective.
   * quoteDate: (string) YYYY-MM-DD format. Date the quote was issued.
   * policyNumber: (string, optional) Current or proposed policy number, if available.
   * planOptionName: (string, optional) If the document details a single plan option, state its name.
   * totalProposedMonthlyPlanPremium: (number, optional) The total monthly premium for the entire proposed plan.
   * rateGuarantees: (string, optional) Text describing any rate guarantees.

2. **COVERAGES (array of objects):**
   For each coverage type mentioned in the document, create an object with:
   * coverageType: (string) Must be one of: "Basic Life", "AD&D", "Dependent Life", "Critical Illness", "LTD", "STD", 
     "Extended Healthcare", "Dental Care", "Vision", "EAP", "Health Spending Account", "HSA"
   * carrierName: (string) The carrier offering this specific coverage.
   * planOptionName: (string) Which plan option this coverage belongs to.
   * premium: (number) The premium amount, as a numeric value.
   * monthlyPremium: (number) Same as premium, for consistency.
   * unitRate: (number) The rate per unit of coverage, as a numeric value.
   * unitRateBasis: (string) Description of the unit basis, e.g., "per $1,000", "per employee".
   * volume: (number) Total coverage volume, as a numeric value.
   * lives: (number) Number of covered individuals.
   * benefitDetails: (object) Coverage-specific details structure varies by coverage type.
     Include all relevant details found in the document.

3. **PLAN NOTES (array of objects):**
   * Capture any important notes, exclusions, conditions, or special provisions mentioned in the document.
   * Each note should be an object with a "note" property containing the text.

IMPORTANT FORMAT NOTES:
* Monetary values should be numeric (not strings with currency symbols or commas).
* Dates should be in YYYY-MM-DD format.
* Use null for missing or N/A fields, not empty strings.
* Use consistent field names exactly as specified.

Here is the extracted text to parse:

TEXT_CONTENT:
{{TEXT_CONTENT}}
`;

/**
 * Helper function to make a Promise-based HTTPS request
 */
function httpsRequest(options: https.RequestOptions, postData?: string): Promise<any> {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
            const parsedData = JSON.parse(data);
            resolve(parsedData);
          } else {
            reject(new Error(`HTTP Error: ${res.statusCode} ${data}`));
          }
        } catch (error) {
          reject(new Error(`Error parsing response: ${error}`));
        }
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    if (postData) {
      req.write(postData);
    }
    
    req.end();
  });
}

/**
 * Get a presigned URL from PDF.co API to upload a file
 */
async function getPresignedUrl(fileName: string): Promise<{ presignedUrl: string, url: string }> {
  if (!PDFCO_API_KEY) {
    throw new Error('PDF.co API key not configured in environment variables');
  }
  
  const options = {
    hostname: 'api.pdf.co',
    path: `/v1/file/upload/get-presigned-url?contenttype=application/octet-stream&name=${encodeURIComponent(fileName)}`,
    method: 'GET',
    headers: {
      'x-api-key': PDFCO_API_KEY
    }
  };
  
  const response = await httpsRequest(options);
  
  if (response.error) {
    throw new Error(`PDF.co Error: ${response.message}`);
  }
  
  return {
    presignedUrl: response.presignedUrl,
    url: response.url
  };
}

/**
 * Upload a file to PDF.co's presigned URL
 */
async function uploadFileToPdfCo(presignedUrl: string, fileBuffer: Buffer): Promise<void> {
  const parsedUrl = new URL(presignedUrl);
  
  const options = {
    hostname: parsedUrl.hostname,
    path: parsedUrl.pathname + parsedUrl.search,
    method: 'PUT',
    headers: {
      'Content-Type': 'application/octet-stream',
      'Content-Length': fileBuffer.length
    }
  };
  
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      if (res.statusCode === 200) {
        resolve();
      } else {
        let errorData = '';
        res.on('data', (chunk) => { errorData += chunk; });
        res.on('end', () => {
          reject(new Error(`Upload failed: ${res.statusCode} ${errorData}`));
        });
      }
    });
    
    req.on('error', reject);
    req.write(fileBuffer);
    req.end();
  });
}

/**
 * Extract text from a PDF file using PDF.co API
 */
async function extractTextFromPdf(fileUrl: string): Promise<string> {
  if (!PDFCO_API_KEY) {
    throw new Error('PDF.co API key not configured in environment variables');
  }
  
  const options = {
    hostname: 'api.pdf.co',
    path: '/v1/pdf/convert/to/text',
    method: 'POST',
    headers: {
      'x-api-key': PDFCO_API_KEY,
      'Content-Type': 'application/json'
    }
  };
  
  const postData = JSON.stringify({
    url: fileUrl,
    inline: true,
    async: false
  });
  
  const response = await httpsRequest(options, postData);
  
  if (response.error) {
    throw new Error(`PDF.co Text Extraction Error: ${response.message}`);
  }
  
  return response.body || '';
}

/**
 * Process extracted text with Gemini API to structure the data
 */
async function structureDataWithGemini(extractedText: string, fileName: string, category: string): Promise<any> {
  if (!GEMINI_API_KEY) {
    throw new Error('Gemini API key not configured in environment variables');
  }
  
  // Replace placeholders in the prompt
  const prompt = GEMINI_PROMPT_TEMPLATE
    .replace('{{FILE_NAME}}', fileName)
    .replace('{{DOCUMENT_CATEGORY}}', category)
    .replace('{{TEXT_CONTENT}}', extractedText);
  
  const requestData = JSON.stringify({
    contents: [
      {
        parts: [
          { text: prompt }
        ]
      }
    ],
    generationConfig: {
      temperature: 0.2,
      maxOutputTokens: 58192,
      topP: 0.8,
      topK: 40
    }
  });
  
  const options = {
    hostname: 'generativelanguage.googleapis.com',
    path: `/v1beta/models/gemini-2.5-pro-preview-05-06:generateContent?key=${GEMINI_API_KEY}`,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    }
  };
  
  try {
    const response = await httpsRequest(options, requestData);
    
    if (response.error) {
      throw new Error(`Gemini API Error: ${JSON.stringify(response.error)}`);
    }
    
    if (!response.candidates || response.candidates.length === 0) {
      throw new Error('No response from Gemini API');
    }
    
    const textContent = response.candidates[0].content.parts[0]?.text;
    if (!textContent) {
      throw new Error('Empty response from Gemini API');
    }
    
    try {
      // Check if response is wrapped in markdown code block and extract the JSON
      let jsonContent = textContent;
      
      // Handle markdown code block format (```json ... ```)
      if (textContent.startsWith('```json') || textContent.startsWith('```')) {
        const codeBlockStartIndex = textContent.indexOf('{');
        const codeBlockEndIndex = textContent.lastIndexOf('}');
        
        if (codeBlockStartIndex !== -1 && codeBlockEndIndex !== -1 && codeBlockEndIndex > codeBlockStartIndex) {
          jsonContent = textContent.substring(codeBlockStartIndex, codeBlockEndIndex + 1);
        }
      }
      
      // Parse the JSON response
      const parsedJson = JSON.parse(jsonContent);
      return parsedJson;
    } catch (jsonError) {
      const errorMessage = jsonError instanceof Error ? jsonError.message : String(jsonError);
      throw new Error(`Failed to parse Gemini response as JSON: ${textContent.substring(0, 200)}...\nError: ${errorMessage}`);
    }
  } catch (error) {
    console.error('Gemini API error:', error);
    // Safely handle error messages regardless of error object structure
    const errorMessage = error instanceof Error ? error.message : 
      typeof error === 'object' && error !== null && 'message' in error ? String(error.message) : 
      String(error);
    throw new Error(`Error calling Gemini API: ${errorMessage}`);
  }
}

export async function POST(req: NextRequest) {
  if (!PDFCO_API_KEY || !GEMINI_API_KEY) {
    return NextResponse.json(
      { error: 'API keys not configured. Please set PDF-UPLOAD-SECRET and GEMINI_API_KEY in environment variables.' },
      { status: 500 }
    );
  }
  
  try {
    // Parse the incoming form data
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const category = formData.get('category') as string | null;
    
    // Validate inputs
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }
    
    if (file.type !== 'application/pdf') {
      return NextResponse.json({ error: 'Invalid file type, only PDF is accepted' }, { status: 400 });
    }
    
    if (!category) {
      return NextResponse.json({ error: 'No category provided' }, { status: 400 });
    }
    
    console.log('Processing file:', file.name, file.size, file.type);
    console.log('Category:', category);
    
    // Read the file as an ArrayBuffer and convert to Buffer
    const arrayBuffer = await file.arrayBuffer();
    const fileBuffer = Buffer.from(arrayBuffer);
    
    // Step 1: Get a presigned URL from PDF.co
    console.log('Step 1: Getting presigned URL from PDF.co');
    const { presignedUrl, url: uploadedFileUrl } = await getPresignedUrl(file.name);
    
    // Step 2: Upload the file to the presigned URL
    console.log('Step 2: Uploading file to PDF.co');
    await uploadFileToPdfCo(presignedUrl, fileBuffer);
    
    // Step 3: Extract text from the PDF using PDF.co API
    console.log('Step 3: Extracting text from PDF');
    const extractedText = await extractTextFromPdf(uploadedFileUrl);
    console.log(`Extracted text length: ${extractedText.length} characters`);
    
    // Step 4: Process the extracted text with Gemini API
    console.log('Step 4: Processing with Gemini API');
    const structuredData = await structureDataWithGemini(extractedText, file.name, category);
    
    // Return the successful response with all data
    return NextResponse.json({
      message: 'File processed successfully',
      originalFileName: file.name,
      category: category,
      // Add original filename and category to the structured data for frontend use
      data: {
        ...structuredData,
        metadata: {
          ...structuredData.metadata,
          fileName: file.name,
          fileCategory: category
        }
      }
    });
  } catch (error) {
    console.error('Error processing document:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: 'Processing failed', details: errorMessage }, { status: 500 });
  }
}
