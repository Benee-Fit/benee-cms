import { NextRequest, NextResponse } from 'next/server';
import { StorageFactory } from '@/lib/storage/storage-factory';
import { auth } from '@clerk/nextjs/server';
import { query, initDocumentsTable, addPdfCoColumns } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

// Get storage provider
const storageProvider = StorageFactory.getProvider('filesystem');

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if we should filter by hasPdfCoUrl
    const { searchParams } = new URL(request.url);
    const hasPdfCoUrl = searchParams.get('hasPdfCoUrl') === 'true';

    if (hasPdfCoUrl) {
      // Initialize database tables if needed
      await initDocumentsTable();
      
      // Get documents with PDF.co URLs from the database
      const documentsResult = await query(
        'SELECT * FROM documents WHERE pdf_co_url IS NOT NULL ORDER BY created_at DESC'
      );
      
      return NextResponse.json(documentsResult.rows);
    } else {
      // Get all documents from the storage provider
      const documents = await storageProvider.listFiles();
      return NextResponse.json(documents);
    }
  } catch (error) {
    console.error('Error listing documents:', error);
    return NextResponse.json(
      { error: 'Failed to list documents' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get form data
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const title = formData.get('title') as string || file.name;
    const documentType = formData.get('documentType') as string || 'Other';

    // Validate file
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file type (PDF only)
    if (!file.type.includes('pdf')) {
      return NextResponse.json(
        { error: 'Only PDF files are allowed' },
        { status: 400 }
      );
    }

    // Initialize PDF.co columns if needed
    await initDocumentsTable();
    await addPdfCoColumns();

    // Convert file to buffer for PDF.co upload
    const fileBuffer = Buffer.from(await file.arrayBuffer());
    const fileSize = file.size;
    
    // Create FormData for the PDF.co API
    const pdfCoFormData = new FormData();
    pdfCoFormData.append('file', new Blob([fileBuffer], { type: 'application/pdf' }), file.name);
    
    // Check if PDF.co API key is configured
    if (!process.env.PDF_CO_API_KEY) {
      console.warn('PDF.co API key is not configured, falling back to local storage');
      
      // Fall back to local storage if PDF.co is not configured
      const document = await storageProvider.uploadFile(file, {
        title: title,
        documentType: documentType,
      });

      return NextResponse.json(document);
    }
    
    // Upload to PDF.co
    const pdfCoResponse = await fetch('https://api.pdf.co/v1/file/upload', {
      method: 'POST',
      headers: {
        'x-api-key': process.env.PDF_CO_API_KEY,
      },
      body: pdfCoFormData,
    }).catch(error => {
      console.error('Error uploading to PDF.co:', error);
      return null;
    });

    // First upload to local storage for compatibility with existing system
    const document = await storageProvider.uploadFile(file, {
      title: title,
      documentType: documentType,
    });
    
    // If PDF.co upload succeeded, store the URL in the database
    if (pdfCoResponse && pdfCoResponse.ok) {
      const pdfCoData = await pdfCoResponse.json();
      
      // Update the document record with PDF.co information
      await query(`
        UPDATE documents 
        SET pdf_co_url = $1, pdf_co_id = $2, file_size_kb = $3 
        WHERE uuid = $4
      `, [
        pdfCoData.url,
        pdfCoData.id,
        Math.round(fileSize / 1024),
        document.id // Using UUID from the document
      ]);
      
      // Add PDF.co URL to the response
      document.pdf_co_url = pdfCoData.url;
      document.pdf_co_id = pdfCoData.id;
    }

    return NextResponse.json(document);
  } catch (error) {
    console.error('Error uploading document:', error);
    return NextResponse.json(
      { error: 'Failed to upload document' },
      { status: 500 }
    );
  }
}
