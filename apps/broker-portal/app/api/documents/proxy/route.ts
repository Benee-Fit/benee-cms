import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Get the document URL from query parameters
    const { searchParams } = new URL(request.url);
    const fileUrl = searchParams.get('url');

    if (!fileUrl) {
      return NextResponse.json(
        { error: 'No file URL provided' },
        { status: 400 }
      );
    }

    // Validate that the URL is from DigitalOcean Spaces
    const url = new URL(fileUrl);
    if (!url.hostname.includes('digitaloceanspaces.com')) {
      return NextResponse.json(
        { error: 'Invalid file URL' },
        { status: 400 }
      );
    }

    // Fetch the PDF from DigitalOcean Spaces
    const response = await fetch(fileUrl);

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch document' },
        { status: response.status }
      );
    }

    // Get the content type and buffer
    const contentType = response.headers.get('content-type') || 'application/pdf';
    const buffer = await response.arrayBuffer();

    // Return the PDF with appropriate headers
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': contentType,
        'Content-Length': buffer.byteLength.toString(),
        'Cache-Control': 'private, max-age=3600', // Cache for 1 hour
      },
    });
  } catch (error) {
    console.error('Error proxying document:', error);
    return NextResponse.json(
      { error: 'Failed to proxy document' },
      { status: 500 }
    );
  }
}