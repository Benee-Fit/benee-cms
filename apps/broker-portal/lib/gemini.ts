import { GoogleGenerativeAI } from '@google/generative-ai';
import { env } from '../env';

const genAI = new GoogleGenerativeAI(env.GOOGLE_GENAI_API_KEY);

// Document types for categorization
export const DOCUMENT_TYPES = [
  'Benefits Booklet',
  'Claim',
  'Compliance Notice',
  'Contract',
  'Employee Census',
  'Form',
  'Invoice',
  'Renewal',
  'Policy',
  'Other',
];

export interface DocumentAnalysisResult {
  carrier?: string;
  renewalDate?: string;
  premium?: number;
  headcount?: number;
  documentType: string;
  confidence: number;
  matchedPolicyNumber?: string;
  matchedCompanyName?: string;
  summary?: string;
  [key: string]: string | number | undefined;
}

export async function analyzeInsuranceDocument(
  pdfBuffer: Buffer,
  fileName: string,
  clientData: Array<{ companyName: string; policyNumber: string }>
): Promise<DocumentAnalysisResult> {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

  const prompt = `
You are an expert insurance document processor. Analyze the uploaded PDF document and extract key information.

AVAILABLE CLIENTS:
${clientData.map((c) => `- ${c.companyName} (Policy: ${c.policyNumber})`).join('\n')}

TASKS:
1. Extract the following information from the PDF:
   - Carrier/Insurance Company name
   - Renewal Date (format: YYYY-MM-DD)
   - Premium amount (numbers only, no currency symbols)
   - Headcount/Employee count (numbers only)

2. Determine the document type from these categories:
   ${DOCUMENT_TYPES.join(', ')}

3. Try to match this document to one of the available clients based on:
   - Company name mentioned in the document
   - Policy number mentioned in the document
   - Any other identifying information

4. Provide a confidence score (0-100) for your analysis

5. Generate a brief summary (2-3 sentences) describing the key contents and purpose of this document

RESPONSE FORMAT:
You must respond with ONLY a valid JSON object in this exact format:
{
  "carrier": "Insurance Company Name or null",
  "renewalDate": "YYYY-MM-DD or null",
  "premium": number or null,
  "headcount": number or null,
  "documentType": "one of the document types",
  "confidence": number between 0-100,
  "matchedPolicyNumber": "policy number or null",
  "matchedCompanyName": "company name or null",
  "summary": "Brief 2-3 sentence summary of the document"
}

CRITICAL REQUIREMENTS:
- Return ONLY the JSON object - no markdown, no explanations, no code blocks
- Use null (not "null" string) for missing values
- Numbers should be actual numbers, not strings
- Be conservative with matches - only match if you're confident
- Document type must be exactly one from the provided list
`;

  let text = '';
  let jsonText = '';

  try {
    // Convert buffer to base64 for Gemini
    const base64Data = pdfBuffer.toString('base64');

    const result = await model.generateContent([
      {
        inlineData: {
          data: base64Data,
          mimeType: 'application/pdf',
        },
      },
      prompt,
    ]);

    const response = await result.response;
    text = response.text();

    // Extract JSON from markdown code blocks if present
    jsonText = text;
    const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (jsonMatch) {
      jsonText = jsonMatch[1];
    }

    // Clean up any remaining markdown or extra whitespace
    jsonText = jsonText.trim();

    const parsed = JSON.parse(jsonText);

    // Validate the response format
    if (typeof parsed !== 'object') {
      throw new Error('Invalid response format');
    }

    // Ensure document type is valid
    if (!DOCUMENT_TYPES.includes(parsed.documentType)) {
      parsed.documentType = 'Other';
    }

    // Ensure confidence is a number between 0-100
    if (
      typeof parsed.confidence !== 'number' ||
      parsed.confidence < 0 ||
      parsed.confidence > 100
    ) {
      parsed.confidence = 50;
    }

    return parsed as DocumentAnalysisResult;
  } catch (error) {
    console.error('Error analyzing document:', error);

    // Log the actual response for debugging
    if (error instanceof SyntaxError) {
      console.error('Gemini response that failed to parse:', text);
      console.error('Extracted JSON text:', jsonText);
    }

    // Return a fallback result
    return {
      carrier: undefined,
      renewalDate: undefined,
      premium: undefined,
      headcount: undefined,
      documentType: 'Other',
      confidence: 0,
      matchedPolicyNumber: undefined,
      matchedCompanyName: undefined,
      summary: 'Unable to analyze document content.',
    };
  }
}
