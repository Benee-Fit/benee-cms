'use server';

/**
 * @fileOverview Filters extracted benefits information to determine its usefulness.
 *
 * - filterExtractedBenefitsInfo - A function that filters the extracted information.
 * - FilterExtractedBenefitsInfoInput - The input type for the filterExtractedBenefitsInfo function.
 * - FilterExtractedBenefitsInfoOutput - The return type for the filterExtractedBenefitsInfo function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'zod';

const FilterExtractedBenefitsInfoInputSchema = z.object({
  question: z.string().describe('The user question about their benefits.'),
  extractedInformation: z.string().describe('The extracted information from the document.'),
});
export type FilterExtractedBenefitsInfoInput = z.infer<
  typeof FilterExtractedBenefitsInfoInputSchema
>;

const FilterExtractedBenefitsInfoOutputSchema = z.object({
  isRelevant: z.boolean().describe('Whether the extracted information is relevant to the question.'),
  reason: z
    .string()
    .optional()
    .describe('The reason why the information is relevant or not.'),
});
export type FilterExtractedBenefitsInfoOutput = z.infer<
  typeof FilterExtractedBenefitsInfoOutputSchema
>;

/**
 * Filters extracted benefits information to determine its usefulness.
 *
 * @param input - The input parameters.
 * @returns Whether the information is relevant and why.
 */
export async function filterExtractedBenefitsInfo(
  input: FilterExtractedBenefitsInfoInput
): Promise<FilterExtractedBenefitsInfoOutput> {
  // Create the prompt for the AI
  const prompt = `
    You are an expert benefits information filter.
    
    You will determine if the extracted information is relevant to the question.
    
    Question: ${input.question}
    Extracted Information: ${input.extractedInformation}
    
    Is the extracted information relevant to the question? Answer with true or false.
    Explain why or why not in the reason field.
    
    Format your response as JSON with the following structure:
    {
      "isRelevant": true/false,
      "reason": "Your explanation here"
    }
  `;

  try {
    // Generate the response using Google AI
    const responseText = await ai.generateText(prompt, { temperature: 0.2 });
    
    // Parse the JSON response
    // Extract JSON from the response text (in case AI includes markdown code blocks)
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Failed to parse AI response as JSON');
    }
    
    const jsonResponse = JSON.parse(jsonMatch[0]);
    
    // Validate the response structure
    if (typeof jsonResponse.isRelevant !== 'boolean') {
      throw new Error('AI response missing required fields');
    }
    
    return {
      isRelevant: jsonResponse.isRelevant,
      reason: jsonResponse.reason || 'No reason provided',
    };
  } catch (error) {
    console.error('Error filtering extracted benefits info:', error);
    
    // Provide a fallback response if something goes wrong
    return {
      isRelevant: false,
      reason: 'Error processing the information. Please try again.',
    };
  }
}
