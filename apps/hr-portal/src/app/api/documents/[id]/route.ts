import { NextRequest, NextResponse } from 'next/server';
import { StorageFactory } from '@/lib/storage/storage-factory';
import { auth } from '@clerk/nextjs/server';

// Get storage provider
const storageProvider = StorageFactory.getProvider('filesystem');

// Next.js App Router pattern for dynamic route segments
export async function GET(request: NextRequest) {
  // Extract the ID from the URL
  const url = new URL(request.url);
  const id = url.pathname.split('/').pop();
  
  if (!id) {
    return NextResponse.json({ error: 'Document ID is required' }, { status: 400 });
  }

  try {
    // Check authentication
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    try {
      // Get file as blob
      const fileBlob = await storageProvider.getFile(id);
      
      // Convert blob to array buffer
      const arrayBuffer = await fileBlob.arrayBuffer();
      
      // Return file as response
      return new NextResponse(arrayBuffer, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="${id}.pdf"`,
        },
      });
    } catch (error) {
      console.error('Error getting document:', error);
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      );
    }
  } catch (error) {
    console.error('Error retrieving document:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve document' },
      { status: 500 }
    );
  }
}

// Next.js App Router pattern for dynamic route segments
export async function DELETE(request: NextRequest) {
  // Extract the ID from the URL
  const url = new URL(request.url);
  const id = url.pathname.split('/').pop();
  
  if (!id) {
    return NextResponse.json({ error: 'Document ID is required' }, { status: 400 });
  }

  try {
    // Check authentication
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Delete file
    const success = await storageProvider.deleteFile(id);
    
    if (success) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      );
    }
  } catch (error) {
    console.error('Error deleting document:', error);
    return NextResponse.json(
      { error: 'Failed to delete document' },
      { status: 500 }
    );
  }
}
