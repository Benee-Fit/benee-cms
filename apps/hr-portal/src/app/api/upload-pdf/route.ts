import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { uploadPdfToPdfCo } from '@/lib/pdf-co';
import { initDocumentsTable, addPdfCoColumns, query } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

// Disable the default body parser for this route
export const config = {
  api: {
    bodyParser: false,
  },
};

/**
 * Handles PDF file uploads, sends directly to PDF.co without storing locally,
 * and stores only the PDF.co URL and metadata in database
 */
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Initialize database tables if needed
    await initDocumentsTable();
    await addPdfCoColumns();

    // Since we're not using formidable for now, we'll directly parse the form data
    const formData = await request.formData();
    
    const file = formData.get('file') as File;
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Get file details
    const fileName = file.name;
    const fileSize = file.size;
    const title = formData.get('title') as string || fileName;
    const metadata = formData.get('metadata') as string || '{}';
    
    // Convert file to buffer
    const fileBuffer = Buffer.from(await file.arrayBuffer());
    
    // Get document type if provided
    const documentType = formData.get('documentType') as string || 'Other';
    
    // Create FormData for the PDF.co API
    const pdfCoFormData = new FormData();
    pdfCoFormData.append('file', new Blob([fileBuffer], { type: 'application/pdf' }), fileName);
    
    // Upload directly to PDF.co
    if (!process.env.PDF_CO_API_KEY) {
      return NextResponse.json({ error: 'PDF.co API key is not configured' }, { status: 500 });
    }
    
    // Make the API request to PDF.co
    const pdfCoResponse = await fetch('https://api.pdf.co/v1/file/upload', {
      method: 'POST',
      headers: {
        'x-api-key': process.env.PDF_CO_API_KEY,
      },
      body: pdfCoFormData,
    });

    if (!pdfCoResponse.ok) {
      const errorData = await pdfCoResponse.json();
      return NextResponse.json(
        { error: `PDF.co upload failed: ${errorData.message || pdfCoResponse.statusText}` },
        { status: 500 }
      );
    }

    const pdfCoData = await pdfCoResponse.json();
    
    // Store only the PDF.co URL and metadata in database
    const documentUuid = uuidv4();
    const insertResult = await query(`
      INSERT INTO documents (
        uuid, title, file_name, document_type, 
        upload_date, size, pdf_co_url, pdf_co_id, 
        file_size_kb, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING id, uuid, pdf_co_url
    `, [
      documentUuid,
      title,
      fileName,
      documentType,
      new Date(),
      fileBuffer.length,
      pdfCoData.url,
      pdfCoData.id,
      Math.round(fileSize / 1024),
      new Date(),
      new Date()
    ]);
    
    const savedDoc = insertResult.rows[0];
    
    return NextResponse.json({
      success: true,
      document: {
        id: savedDoc.id,
        uuid: savedDoc.uuid,
        url: savedDoc.pdf_co_url,
      },
    });
  } catch (error) {
    console.error('Error in PDF upload:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
