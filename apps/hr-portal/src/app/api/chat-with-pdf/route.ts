import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getDocumentsWithPdfCo } from '@/lib/pdf-co';
import { askDocumentQuestionWithUrls } from '@/lib/document-understanding-url';

// Type definition for cached responses
type CachedResponse = {
  response: any;
  timestamp: number;
};

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
    
    // Create a unique request identifier
    const documentIds = relevantPdfIds.sort().join(',');
    const requestId = sessionId ? `${sessionId}:${userMessage}:${documentIds}` : `${userId}:${userMessage}:${documentIds}`;
    
    // Check if we already have this request in progress or cached
    if (requestCache.has(requestId)) {
      console.log('Using cached response for request:', requestId);
      const cachedResult = requestCache.get(requestId);
      return NextResponse.json(cachedResult!.response);
    }
    
    // Retrieve PDF.co URLs from the database based on the provided UUIDs
    // No need to convert strings to numbers - they're UUIDs
    console.log(`Fetching documents with UUIDs:`, relevantPdfIds);
    const documents = await getDocumentsWithPdfCo(relevantPdfIds);
    
    if (!documents || documents.length === 0) {
      return NextResponse.json(
        { error: 'No documents found with the provided IDs' },
        { status: 404 }
      );
    }
    
    // Filter out documents without PDF.co URLs
    const validDocuments = documents.filter(doc => doc.pdf_co_url);
    
    if (validDocuments.length === 0) {
      return NextResponse.json({
        response: "I wasn't able to find any PDF.co URLs for the provided document IDs."
      });
    }
    
    // Convert conversation history to the format expected by document understanding
    const formattedHistory = chatHistory && Array.isArray(chatHistory) && chatHistory.length > 0
      ? chatHistory.map((exchange: { role: string; content: string }) => ({
          role: exchange.role === 'user' ? 'user' : 'model',
          text: exchange.content
        }))
      : undefined;
    
    // Use the URL-based document understanding function to get a response
    // This directly sends PDF.co URLs to Gemini instead of base64 encoding
    const responseText = await askDocumentQuestionWithUrls(
      validDocuments,  // Documents with PDF.co URLs
      userMessage,     // User's question
      formattedHistory // Optional conversation history
    );
    
    if (!responseText) {
      throw new Error('No response from Gemini');
    }
    
    // Format the response data
    const responseData = {
      response: responseText,
      documentInfo: validDocuments.map(doc => ({
        id: doc.id,
        title: doc.title,
        fileName: doc.file_name || doc.fileName, // Handle both field naming conventions
        url: doc.pdf_co_url
      })),
    };
    
    // Cache the response
    requestCache.set(requestId, {
      response: responseData,
      timestamp: Date.now()
    });
    
    // Return response
    return NextResponse.json(responseData);
  } catch (error) {
    console.error('Error in chat-with-pdf route:', error);
    return NextResponse.json(
      { error: 'Failed to process chat request', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
