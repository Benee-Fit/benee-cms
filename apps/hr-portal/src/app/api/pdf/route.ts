import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';

// In-memory cache for PDFs (will be cleared on serverless function cold starts)
// For production, you might want to use a more persistent solution like S3 or a database
type PdfCache = {
  [key: string]: {
    data: string; // Base64 data
    timestamp: number; // For potential cleanup of old files
  };
};

// Initialize the global cache if it doesn't exist
declare global {
  var pdfCache: PdfCache;
}

if (typeof global.pdfCache === 'undefined') {
  global.pdfCache = {};
}

// Cleanup function to remove old PDFs (older than 10 minutes)
const cleanupOldPdfs = () => {
  const now = Date.now();
  const tenMinutesMs = 10 * 60 * 1000;
  
  Object.keys(global.pdfCache).forEach(key => {
    if (now - global.pdfCache[key].timestamp > tenMinutesMs) {
      console.log('Cleaning up old PDF:', key);
      delete global.pdfCache[key];
    }
  });
};

export async function POST(request: NextRequest) {
  try {
    // Run cleanup to remove old PDFs
    cleanupOldPdfs();
    
    // Parse the request body
    const body = await request.json();
    const { pdfDataUri } = body;
    
    if (!pdfDataUri || typeof pdfDataUri !== 'string') {
      return NextResponse.json(
        { error: 'PDF data URI is required' },
        { status: 400 }
      );
    }
    
    console.log('Received PDF data URI of length:', pdfDataUri.length);
    
    // Extract the base64 data from the data URI
    let base64Data;
    if (pdfDataUri.includes('base64,')) {
      base64Data = pdfDataUri.split('base64,')[1];
    } else {
      base64Data = pdfDataUri; // Assume it's already base64 without the data URI prefix
    }
    
    if (!base64Data) {
      return NextResponse.json(
        { error: 'Invalid PDF data URI format' },
        { status: 400 }
      );
    }
    
    // Clean the base64 data (remove whitespace and line breaks)
    base64Data = base64Data.replace(/\s/g, '');
    
    // Generate a unique ID for the PDF
    const pdfId = uuidv4();
    
    // Store the PDF in memory
    global.pdfCache[pdfId] = {
      data: base64Data,
      timestamp: Date.now(),
    };
    
    console.log('PDF stored in memory cache with ID:', pdfId);
    console.log('PDF size in cache:', base64Data.length, 'characters');
    
    // Return the ID for later retrieval
    return NextResponse.json({ filename: pdfId });
  } catch (error) {
    console.error('Error storing PDF:', error);
    return NextResponse.json(
      { error: 'Failed to store PDF', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
