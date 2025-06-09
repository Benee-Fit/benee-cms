import { NextRequest, NextResponse } from 'next/server';
import { database } from '@repo/database';
import { deleteFromSpaces } from '../../../../../../lib/do-spaces';

interface RouteParams {
  params: {
    id: string;
    docId: string;
  };
}

// DELETE document
export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    // Get document to find the file URL
    const document = await database.brokerClientDocument.findUnique({
      where: { id: params.docId },
    });
    
    if (!document || document.clientId !== params.id) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      );
    }
    
    // Extract key from URL
    const url = new URL(document.fileUrl);
    const key = url.pathname.substring(1); // Remove leading slash
    
    // Delete from DO Spaces
    await deleteFromSpaces(key);
    
    // Delete from database
    await database.brokerClientDocument.delete({
      where: { id: params.docId },
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting document:', error);
    return NextResponse.json(
      { error: 'Failed to delete document' },
      { status: 500 }
    );
  }
}