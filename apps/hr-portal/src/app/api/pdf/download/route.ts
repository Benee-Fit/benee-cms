import { NextRequest, NextResponse } from 'next/server';

// Define the cache type here as well since we can't import it from the other route
type PdfCache = {
  [key: string]: {
    data: string; // Base64 data
    timestamp: number; // For potential cleanup of old files
  };
};

// Access the cache from the global scope (this works because of how Next.js handles API routes)
// In a production environment, you'd use a more persistent storage solution
declare global {
  var pdfCache: PdfCache;
}

// Initialize the global cache if it doesn't exist
if (typeof global.pdfCache === 'undefined') {
  global.pdfCache = {};
}

export async function GET(request: NextRequest) {
  try {
    // Get the PDF ID from the query parameter
    const { searchParams } = new URL(request.url);
    const pdfId = searchParams.get('filename');
    
    console.log('Download request for PDF ID:', pdfId);
    
    // Validate PDF ID
    if (!pdfId) {
      console.error('No PDF ID provided');
      return NextResponse.json(
        { error: 'PDF ID is required' },
        { status: 400 }
      );
    }
    
    // Check if PDF exists in cache
    if (!global.pdfCache[pdfId]) {
      console.error('PDF not found in cache:', pdfId);
      return NextResponse.json(
        { error: 'PDF not found' },
        { status: 404 }
      );
    }
    
    // Get the PDF data from cache
    const base64Data = global.pdfCache[pdfId].data;
    
    // Convert base64 to buffer
    const buffer = Buffer.from(base64Data, 'base64');
    
    // Return the PDF file
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="document-${pdfId}.pdf"`,
      },
    });
  } catch (error) {
    console.error('Error downloading PDF:', error);
    return NextResponse.json(
      { error: 'Failed to download PDF', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
