'use server';
import { z } from 'zod';
import { answerBenefitsQuestion, type AnswerBenefitsQuestionInput, type AnswerBenefitsQuestionOutput } from '@/ai/flows/answer-benefits-question';
// filterExtractedBenefitsInfo might be used later to refine results, e.g., after retrieving an answer.

const searchSchema = z.object({
  query: z.string().min(3, "Query must be at least 3 characters long."),
});

export interface SearchState {
  result?: AnswerBenefitsQuestionOutput;
  error?: string;
  query?: string;
  timestamp?: number;
}

export async function handleSearchQuery(prevState: SearchState, formData: FormData): Promise<SearchState> {
  const validatedFields = searchSchema.safeParse({
    query: formData.get('query'),
  });

  if (!validatedFields.success) {
    return {
      error: validatedFields.error.flatten().fieldErrors.query?.join(', ') || "Invalid query.",
      timestamp: Date.now(),
    };
  }

  const query = validatedFields.data.query;

  // TODO: This benefitBooklet should be dynamically sourced based on user context, selected document, or a broader knowledge base.
  // For demonstration, using a very small, generic sample.
  const sampleBenefitBooklet = `
    Benefit Plan Summary:
    - Dental Coverage: Includes two routine check-ups and cleanings per year. Major dental procedures like crowns or root canals are covered at 50% after deductible, up to an annual maximum of $1500. Orthodontic services are not covered for members over age 19.
    - Vision Care: One eye examination is covered every 12 months. Standard lenses are covered in full. Frames are covered up to $150 every 24 months. Contact lenses (in lieu of glasses) are covered up to $130 per year.
    - Health Savings Account (HSA): Eligible employees can contribute pre-tax dollars to an HSA. The company may also provide a seed contribution at the start of each plan year. Funds can be used for qualified medical expenses.
    - Prescription Drugs: Generic drugs have a $10 co-pay. Preferred brand-name drugs have a $35 co-pay. Non-preferred brand-name drugs have a $60 co-pay. Some specialty medications may require prior authorization.
    - Mental Health Support: Access to 5 counseling sessions per year at no cost through the Employee Assistance Program (EAP). Additional therapy sessions are covered under the main medical plan subject to deductible and co-insurance.
  `;

  try {
    const aiInput: AnswerBenefitsQuestionInput = {
      question: query,
      benefitBooklet: sampleBenefitBooklet,
    };
    const aiResponse = await answerBenefitsQuestion(aiInput);
    
    // Potentially use filterExtractedBenefitsInfo here if needed
    // For example, if aiResponse.answer was too generic, or to double check relevance.
    // const filterInput = { question: query, extractedInformation: aiResponse.answer };
    // const filterOutput = await filterExtractedBenefitsInfo(filterInput);
    // if (!filterOutput.isRelevant) {
    //   return { error: "The information found was not relevant to your question.", query, timestamp: Date.now() };
    // }

    return { result: aiResponse, query, timestamp: Date.now() };
  } catch (e) {
    console.error("AI search error:", e);
    // It's good to avoid exposing raw error messages to the client.
    let errorMessage = "Failed to get an answer from AI. Please try again later.";
    if (e instanceof Error) {
      // You might log e.message to your server logs for debugging.
    }
    return { error: errorMessage, query, timestamp: Date.now() };
  }
}
