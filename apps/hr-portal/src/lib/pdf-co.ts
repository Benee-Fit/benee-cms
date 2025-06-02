/**
 * PDF.co API integration utility
 * Handles PDF uploads and operations with PDF.co service
 */
import { v4 as uuidv4 } from 'uuid';
import { db, retryOperation, query } from './db';
import { documents } from './db/schema';
import { eq } from 'drizzle-orm';

// PDF.co API base URL
const PDF_CO_API_BASE = 'https://api.pdf.co/v1';

/**
 * Uploads a PDF file to PDF.co
 * @param fileBuffer - The PDF file buffer to upload
 * @param fileName - The original filename
 * @param title - Optional title for the document
 * @param documentType - Optional document type
 * @returns Promise with the PDF.co response and document data
 */
export async function uploadPdfToPdfCo(fileBuffer: Buffer, fileName: string, title?: string, documentType: string = 'Other'): Promise<{
  url: string;
  id: string;
  fileSize: number;
  uuid: string;
  documentId: number;
}> {
  if (!process.env.PDF_CO_API_KEY) {
    throw new Error('PDF.co API key is not configured');
  }

  try {
    // Calculate file size in KB
    const fileSize = Math.round(fileBuffer.length / 1024);
    const documentUuid = uuidv4();
    
    // Create FormData for the file upload
    const formData = new FormData();
    const blob = new Blob([fileBuffer], { type: 'application/pdf' });
    formData.append('file', blob, fileName);

    // Make the API request to PDF.co
    const response = await fetch(`${PDF_CO_API_BASE}/file/upload`, {
      method: 'POST',
      headers: {
        'x-api-key': process.env.PDF_CO_API_KEY,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`PDF.co upload failed: ${errorData.message || response.statusText}`);
    }

    const data = await response.json();
    
    // Store in database with both filesystem and PDF.co data
    const insertedDoc = await retryOperation(async () => {
      // Prepare the document data with both local storage and PDF.co fields
      const docData = {
        uuid: documentUuid,
        fileName: fileName,
        title: title || fileName,
        documentType: documentType,
        uploadDate: new Date(),
        size: fileBuffer.length,  // Size in bytes (for compatibility)
        file_size_kb: fileSize,   // Size in KB (for PDF.co)
        path: `/uploads/${documentUuid}.pdf`, // Path for local storage compatibility
        pdf_co_url: data.url,
        pdf_co_id: data.id,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      const [inserted] = await db.insert(documents).values(docData).returning();
      return inserted;
    });
    
    // Return the URL and ID from PDF.co
    return {
      url: data.url,
      id: data.id,
      fileSize: fileSize,
      uuid: documentUuid,
      documentId: insertedDoc.id
    };
  } catch (error) {
    console.error('Error uploading to PDF.co:', error);
    throw error;
  }
}

/**
 * Get document details from both database and PDF.co
 * @param id - The document ID
 */
export async function getDocumentWithPdfCo(id: number) {
  return retryOperation(async () => {
    const doc = await db.select().from(documents).where(eq(documents.id, id)).limit(1);
    if (!doc || doc.length === 0) {
      throw new Error(`Document with ID ${id} not found`);
    }
    return doc[0];
  });
}

/**
 * Get multiple documents with PDF.co URLs
 * @param documentIdentifiers - Array of document UUIDs (or IDs if numeric)
 */
export async function getDocumentsWithPdfCo(documentIdentifiers: string[] | number[]) {
  if (!documentIdentifiers.length) return [];
  
  // Determine if we're dealing with UUIDs (strings) or numeric IDs
  const isUuidQuery = typeof documentIdentifiers[0] === 'string';
  const idField = isUuidQuery ? 'uuid' : 'id';
  
  // For compatibility with our custom columns, use the raw query function
  const placeholders = documentIdentifiers.map((_, index) => `$${index + 1}`).join(', ');
  
  return retryOperation(async () => {
    // Use a raw SQL query to get documents with PDF.co URLs
    const result = await query(
      `SELECT * FROM documents 
       WHERE ${idField} IN (${placeholders}) 
       AND pdf_co_url IS NOT NULL 
       ORDER BY created_at DESC`,
      documentIdentifiers
    );
    
    console.log(`Found ${result.rows.length} documents with PDF.co URLs by ${idField}`);
    return result.rows;
  });
}

/**
 * Gets PDF information from PDF.co
 * @param pdfCoId - The PDF.co file ID
 * @returns Promise with the PDF details
 */
export async function getPdfInfo(pdfCoId: string) {
  if (!process.env.PDF_CO_API_KEY) {
    throw new Error('PDF.co API key is not configured');
  }

  try {
    const response = await fetch(`${PDF_CO_API_BASE}/pdf/info?url=${pdfCoId}`, {
      method: 'GET',
      headers: {
        'x-api-key': process.env.PDF_CO_API_KEY,
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Failed to get PDF info: ${errorData.message || response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error getting PDF info:', error);
    throw error;
  }
}
