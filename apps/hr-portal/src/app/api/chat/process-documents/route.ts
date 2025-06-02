import { NextRequest, NextResponse } from 'next/server';
import { StorageFactory } from '@/lib/storage/storage-factory';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { documents } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

// Get storage provider
const storageProvider = StorageFactory.getProvider('filesystem');

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get document IDs from request
    const { documentIds } = await request.json();
    
    if (!documentIds || !Array.isArray(documentIds)) {
      return NextResponse.json(
        { error: 'Document IDs are required' },
        { status: 400 }
      );
    }

    // Limit the number of documents that can be processed at once
    if (documentIds.length > 10) {
      return NextResponse.json(
        { error: 'Maximum of 10 documents can be processed at once' },
        { status: 400 }
      );
    }

    // Process each document
    const documentContents = await Promise.all(
      documentIds.map(async (id) => {
        try {
          // Get document metadata from database
          const [document] = await db.select().from(documents).where(eq(documents.uuid, id)).limit(1);
          
          if (!document) {
            return { id, error: 'Document not found', content: null };
          }

          // Get document content
          const fileBlob = await storageProvider.getFile(id);
          
          // Convert the blob to a Buffer for easier handling in Node.js
          // This avoids issues with Blob implementation differences
          const buffer = Buffer.from(await fileBlob.arrayBuffer());
          
          return {
            id,
            title: document.title,
            fileName: document.fileName,
            documentType: document.documentType,
            buffer: buffer, // Pass buffer instead of blob
          };
        } catch (error) {
          console.error(`Error processing document ${id}:`, error);
          return { id, error: 'Failed to process document', content: null };
        }
      })
    );

    return NextResponse.json({ documents: documentContents });
  } catch (error) {
    console.error('Error processing documents:', error);
    return NextResponse.json(
      { error: 'Failed to process documents' },
      { status: 500 }
    );
  }
}
