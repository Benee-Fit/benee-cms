'use server';

import { GoogleGenAI } from '@google/genai';
import { DocumentMetadata } from './storage/storage-interface';

/**
 * Uses Google Gemini's document understanding capabilities
 * This implementation passes PDF.co URLs directly to Gemini without downloading
 * any files or using base64 encoding.
 */

// Initialize the Google AI client with the API key
const api = new GoogleGenAI({ 
  apiKey: process.env.GEMINI_API_KEY || '' 
});

/**
 * Ask a question about PDF documents using Gemini's document understanding
 * by passing PDF.co URLs directly
 * 
 * @param documents Array of document metadata with PDF.co URLs
 * @param question The user's question
 * @param history Optional conversation history
 * @returns Gemini's response text
 */
export async function askDocumentQuestionWithUrls(
  documents: Array<DocumentMetadata>,
  question: string,
  history?: Array<{ role: string; text: string }>
): Promise<string> {
  try {
    // Verify API key is available
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY environment variable is required');
    }
    
    // Filter for documents with PDF.co URLs
    const validDocuments = documents.filter(doc => doc.pdf_co_url);
    if (validDocuments.length === 0) {
      return "I don't have any valid PDF documents to analyze.";
    }
    
    console.log(`Processing ${validDocuments.length} documents with question: "${question}"`);
    
    // Format the document titles and URLs for the prompt
    const documentInfo = validDocuments.map((doc, index) => {
      const title = doc.title || doc.fileName || `Document ${index + 1}`;
      return `Document ${index + 1}: ${title} - ${doc.pdf_co_url}`;
    }).join('\n');
    
    // Construct a detailed prompt that includes the PDF.co URLs
    const prompt = `You are an expert in group benefits helping HR understand plan details as if speaking to a broker. Your job is to answer questions about benefits plans.    
I'm going to ask you questions about PDF documents available at these URLs:

${documentInfo}

Please analyze these documents and answer the following question: ${question}

Use clear, simple language. Show values in CAD.
    
    Try to only answer the question answered and only show this information: reimbursement amount and out of pocket cost
    
    If you don't know the answer, say so. Don't make up information.

    CRITICAL - Refer to the documents by their generic names - e.g. "Benefit Booklet" or "Renewal Document" - NEVER "Document 1", "Document 2", etc.
    
    CRITICAL - Don't say things like "I've reviewed the booklet" or "based on the documents you provide". Just give me the facts.

    `;
    
    console.log('Sending request to Gemini with PDF.co URLs...');
    
    // Generate content with the prompt that includes PDF.co URLs
    const response = await api.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: [{ 
        role: 'user', 
        parts: [{ text: prompt }]
      }]
    });
    
    console.log('Received response from Gemini');
    
    // Return the response text with fallback
    return response.text || 'No response received from Gemini.';
  } catch (error) {
    console.error('Error processing documents with Gemini:', error);
    throw error;
  }
}
