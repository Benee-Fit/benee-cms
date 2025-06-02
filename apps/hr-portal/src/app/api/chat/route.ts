import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { GoogleGenAI } from '@google/genai';
import { getDocumentsWithPdfCo } from '@/lib/pdf-co';
import { DocumentMetadata } from '@/lib/storage/storage-interface';
import { db } from '@/lib/db';
import { documents } from '@/lib/db/schema';

// Type definition for cached responses
type CachedResponse = {
  response: any;
  timestamp: number;
};

// Initialize Google AI client
const googleAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

// In-memory cache to prevent duplicate requests
const requestCache = new Map<string, CachedResponse>();

// Clear expired cache entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of requestCache.entries()) {
    if (value.timestamp && now - value.timestamp > 5 * 60 * 1000) {
      requestCache.delete(key);
    }
  }
}, 5 * 60 * 1000);

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Get request body
    const { userMessage, relevantPdfIds, chatHistory, sessionId } = await request.json();
    
    if (!userMessage || typeof userMessage !== 'string') {
      return NextResponse.json(
        { error: 'User message is required' },
        { status: 400 }
      );
    }
    
    if (!relevantPdfIds || !Array.isArray(relevantPdfIds) || relevantPdfIds.length === 0) {
      return NextResponse.json(
        { error: 'Relevant PDF IDs are required' },
        { status: 400 }
      );
    }
    
    console.log('Chat API: Passing PDF.co URLs directly to Gemini');
    
    // Create a unique request identifier from session ID, message, and document IDs
    // This helps prevent duplicate requests with the same parameters
    const documentIdsString = relevantPdfIds.sort().join(',');
    const requestId = sessionId ? `${sessionId}:${userMessage}:${documentIdsString}` : `${userId}:${userMessage}:${documentIdsString}`;
    
    // Check if we already have this request in progress or cached
    if (requestCache.has(requestId)) {
      console.log('Using cached response for request:', requestId);
      const cachedResult = requestCache.get(requestId);
      return NextResponse.json(cachedResult!.response);
    }
    
    // Validate document IDs
    if (relevantPdfIds.length === 0) {
      return NextResponse.json({
        response: "I wasn't able to find valid document IDs in your request."
      });
    }
    
    console.log(`Retrieving documents with IDs:`, relevantPdfIds);
    
    try {
      // Fetch documents with PDF.co URLs from the database
      const documentsWithUrls = await getDocumentsWithPdfCo(relevantPdfIds);
      
      if (!documentsWithUrls || documentsWithUrls.length === 0) {
        return NextResponse.json({
          response: "I wasn't able to retrieve the PDF.co URLs for the provided documents."
        });
      }
      
      // Filter documents that have valid PDF.co URLs
      const validDocuments = documentsWithUrls.filter(doc => doc.pdf_co_url);
      
      if (validDocuments.length === 0) {
        return NextResponse.json({
          response: "None of the specified documents have valid PDF.co URLs."
        });
      }
      
      // Format document info for the prompt
      const documentInfo = validDocuments
        .map((doc, index) => {
          const title = doc.title || doc.fileName || `Document ${index + 1}`;
          return `Document ${index + 1}: ${title} - ${doc.pdf_co_url}`;
        })
        .join('\n');
      
      // Construct the prompt with PDF.co URLs
      const prompt = `You are an expert in group benefits helping HR understand plan details as if speaking to a broker. Your job is to answer questions about benefits plans.    
      I'm going to ask you questions about PDF documents available at these URLs:
      
      ${documentInfo}
      
      Please analyze these documents and answer the following question: ${userMessage}
      
      Use clear, simple language. Show values in CAD.
      
      Try to only answer the question asked and only show relevant information: reimbursement amount and out of pocket cost.
      
      If you don't know the answer, say so. Don't make up information.
      
      CRITICAL - Refer to the documents by their generic names - e.g. "Benefit Booklet" or "Renewal Document" - NEVER "Document 1", "Document 2", etc.
      
      CRITICAL - Don't say things like "I've reviewed the booklet" or "based on the documents you provide". Just give me the facts.`;
      
      console.log('Sending request to Gemini with PDF.co URLs...');
      
      // Use Gemini to process the query
      const model = googleAI.models.generateContent({
        model: 'gemini-2.0-flash',
        contents: [{ role: 'user', parts: [{ text: prompt }] }]
      });
      
      const response = await model;
      
      if (!response.text) {
        throw new Error('No response text returned from Gemini');
      }
      
      // Format the response data
      const responseData = {
        response: response.text,
        documentInfo: validDocuments.map((doc) => ({
          id: doc.id,
          title: doc.title,
          fileName: doc.fileName || doc.title,
        })),
      };
      
      // Cache the response
      requestCache.set(requestId, {
        response: responseData,
        timestamp: Date.now()
      });
      
      // Return response
      return NextResponse.json(responseData);
      
    } catch (dbError) {
      console.error('Database error:', dbError);
      return NextResponse.json({
        error: 'Failed to retrieve documents from database',
        details: dbError instanceof Error ? dbError.message : String(dbError)
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Error in chat route:', error);
    return NextResponse.json({
      error: 'Failed to process chat request', 
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
