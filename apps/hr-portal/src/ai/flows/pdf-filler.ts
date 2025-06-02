'use server';

/**
 * @fileOverview An AI agent that fills a PDF template based on user input using Gemini AI integration.
 *
 * - pdfFiller - A function that fills the PDF template using Gemini AI.
 * - PdfFillerInput - The input type for the pdfFiller function.
 * - PdfFillerOutput - The return type for the pdfFiller function.
 */

import { z } from 'zod';
import { fillPdfWithGemini } from '@/lib/gemini-pdf-filler';

const PdfFillerInputSchema = z.object({
  pdfTemplateDataUri: z
    .string()
    .describe(
      'The PDF template file, as a data URI that must include a MIME type and use Base64 encoding. Expected format: \'data:<mimetype>;base64,<encoded_data>\'.' // Compliant
    ),
  formData: z
    .record(z.string())
    .describe('The form data to fill the PDF template with.'),
});
export type PdfFillerInput = z.infer<typeof PdfFillerInputSchema>;

const PdfFillerOutputSchema = z.object({
  filledPdfDataUri: z
    .string()
    .describe(
      'The filled PDF file, as a data URI that must include a MIME type and use Base64 encoding. Expected format: \'data:<mimetype>;base64,<encoded_data>\'.' // Compliant
    ),
});
export type PdfFillerOutput = z.infer<typeof PdfFillerOutputSchema>;

/**
 * Fills a PDF template with form data using Gemini AI
 * @param input The input containing the PDF template and form data
 * @returns The filled PDF as a data URI
 */
export async function pdfFiller(input: PdfFillerInput): Promise<PdfFillerOutput> {
  // Use our Gemini AI integration
  return fillPdfWithGemini(input);
}