'use server';

import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';

// Initialize the Google AI client
const getGoogleAI = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not defined in environment variables');
  }
  return new GoogleGenerativeAI(apiKey);
};

// Safety settings for the model
const safetySettings = [
  {
    category: HarmCategory.HARM_CATEGORY_HARASSMENT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
];

/**
 * Generate content using Google's Generative AI
 * @param prompt The prompt to send to the model
 * @param options Additional options for the model
 * @returns The generated content
 */
export async function generateContent(
  prompt: string,
  options: {
    model?: string;
    temperature?: number;
    maxOutputTokens?: number;
  } = {}
): Promise<string> {
  try {
    const {
      model = 'gemini-1.5-pro',
      temperature = 0.7,
      maxOutputTokens = 2048,
    } = options;

    const googleAI = getGoogleAI();
    const genModel = googleAI.getGenerativeModel({
      model,
      safetySettings,
      generationConfig: {
        temperature,
        maxOutputTokens,
      },
    });

    const result = await genModel.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error('Error generating content with Google AI:', error);
    throw error;
  }
}

/**
 * Extract structured data from text using Google's Generative AI
 * @param prompt The prompt to send to the model
 * @param schema The schema for the structured data
 * @param options Additional options for the model
 * @returns The extracted structured data
 */
export async function extractStructuredData<T>(
  prompt: string,
  schema: Record<string, any>,
  options: {
    model?: string;
    temperature?: number;
    maxOutputTokens?: number;
  } = {}
): Promise<T> {
  try {
    const schemaPrompt = `
${prompt}

Extract the information as a valid JSON object with the following schema:
${JSON.stringify(schema, null, 2)}

Return ONLY the JSON object, no additional text.
`;

    const jsonString = await generateContent(schemaPrompt, {
      ...options,
      temperature: options.temperature || 0.1, // Lower temperature for structured data
    });

    // Extract the JSON object from the response
    const jsonMatch = jsonString.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Failed to extract JSON from model response');
    }

    return JSON.parse(jsonMatch[0]) as T;
  } catch (error) {
    console.error('Error extracting structured data with Google AI:', error);
    throw error;
  }
}

/**
 * Check if Google AI is properly configured
 * @returns True if the API key is set, false otherwise
 */
export async function isGoogleAIConfigured(): Promise<boolean> {
  return Promise.resolve(!!process.env.GEMINI_API_KEY);
}
