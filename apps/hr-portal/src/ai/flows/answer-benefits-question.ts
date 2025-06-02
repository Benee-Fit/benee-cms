'use server';

/**
 * @fileOverview An AI agent that answers questions about benefits plans.
 *
 * - answerBenefitsQuestion - A function that answers questions about benefits plans.
 * - AnswerBenefitsQuestionInput - The input type for the answerBenefitsQuestion function.
 * - AnswerBenefitsQuestionOutput - The return type for the answerBenefitsQuestion function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'zod';

const AnswerBenefitsQuestionInputSchema = z.object({
  question: z.string().describe('The question about the benefits plan.'),
  benefitBooklet: z.string().describe('The benefit booklet content.'),
});

const AnswerBenefitsQuestionOutputSchema = z.object({
  answer: z.string().describe('The answer to the question.'),
  references: z.array(z.string()).describe('References to the benefit booklet.'),
});

export type AnswerBenefitsQuestionInput = z.infer<typeof AnswerBenefitsQuestionInputSchema>;
export type AnswerBenefitsQuestionOutput = z.infer<typeof AnswerBenefitsQuestionOutputSchema>;

/**
 * Answers questions about benefits plans using Google AI.
 *
 * @param input - The input parameters containing the question and benefit booklet content.
 * @returns The answer and references to the benefit booklet.
 */
export async function answerBenefitsQuestion(input: AnswerBenefitsQuestionInput): Promise<AnswerBenefitsQuestionOutput> {
  // Create the prompt for the AI
  const prompt = `
    ou are an expert in group benefits helping HR understand plan details as if speaking to a broker. Your job is to answer questions about benefits plans.
    
    Here is the benefit booklet content:
    ${input.benefitBooklet}
    
    Answer the following question about the benefits plan:
    ${input.question}

    Use clear, simple language. Show values in CAD.
    
    Try to only answer the question answered and only show this information: reimbursement amount and out of pocket cost
    
    If you don't know the answer, say so. Don't make up information.

    CRITICAL - Refer to the documents by their generic names - e.g. "Benefit Booklet" or "Renewal Document" - NEVER "Document 1", "Document 2", etc.
    
    Format your response as JSON with the following structure:
    {
      "answer": "Your detailed answer here",
      "references": ["Section reference 1", "Section reference 2"]
    }
  `;

  try {
    // Generate the response using Google AI
    const response = await ai.generate(prompt);
    
    // Extract the response text
    const responseText = response.text || response.toString();
    
    // Parse the JSON response
    // Extract JSON from the response text (in case AI includes markdown code blocks)
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Failed to parse AI response as JSON');
    }
    
    const jsonResponse = JSON.parse(jsonMatch[0]);
    
    // Validate the response structure
    if (!jsonResponse.answer || !Array.isArray(jsonResponse.references)) {
      throw new Error('AI response missing required fields');
    }
    
    return {
      answer: jsonResponse.answer,
      references: jsonResponse.references,
    };
  } catch (error) {
    console.error('Error answering benefits question:', error);
    
    // Provide a fallback response if something goes wrong
    return {
      answer: 'I apologize, but I encountered an error while processing your question. Please try again or contact support for assistance.',
      references: [],
    };
  }
}
