/**
 * Client-side utility for PDF.co API integration
 * Provides functions to upload PDFs and chat with documents
 */

/**
 * Upload a PDF file to PDF.co through our Next.js API
 * @param file The PDF file to upload
 * @param title Optional title for the document
 * @param metadata Optional metadata for the document
 * @returns The uploaded document info with ID and URL
 */
export async function uploadPdfToPdfCo(
  file: File,
  title?: string,
  metadata?: Record<string, any>
): Promise<{ id: number; url: string }> {
  if (!file.type.includes('pdf')) {
    throw new Error('Only PDF files are allowed');
  }

  // Create form data for the upload
  const formData = new FormData();
  formData.append('file', file);
  
  if (title) {
    formData.append('title', title);
  }
  
  if (metadata) {
    formData.append('metadata', JSON.stringify(metadata));
  }

  // Send the file to our API route
  const response = await fetch('/api/upload-pdf', {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to upload PDF');
  }

  const data = await response.json();
  return data.document;
}

/**
 * Chat with documents using Gemini and PDF.co URLs
 * @param userMessage The user's message or question
 * @param relevantPdfIds Array of document IDs that are relevant to the question
 * @param chatHistory Previous chat history for context
 * @param sessionId Optional session ID for caching
 * @returns The chat response and document info
 */
export async function chatWithPdfs(
  userMessage: string,
  relevantPdfIds: number[],
  chatHistory?: Array<{ role: 'user' | 'assistant'; content: string }>,
  sessionId?: string
): Promise<{
  response: string;
  documentInfo: Array<{
    id: number;
    title: string;
    fileName: string;
    url: string;
  }>;
}> {
  const response = await fetch('/api/chat-with-pdf', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      userMessage,
      relevantPdfIds,
      chatHistory,
      sessionId,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to process chat request');
  }

  return await response.json();
}

/**
 * Retrieve all documents with PDF.co URLs
 * @returns Array of documents with PDF.co URLs
 */
export async function getDocumentsWithPdfCoUrls(): Promise<Array<{
  id: number;
  title: string;
  file_name: string;
  pdf_co_url: string;
  created_at: string;
}>> {
  const response = await fetch('/api/documents?hasPdfCoUrl=true', {
    method: 'GET',
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to retrieve documents');
  }

  return await response.json();
}
