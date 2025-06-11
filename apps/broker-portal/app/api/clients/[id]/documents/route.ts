import { NextRequest, NextResponse } from 'next/server';
import { database } from '@repo/database';
import { uploadToSpaces } from '../../../../../lib/do-spaces';

// GET all documents for a client
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const documents = await database.brokerClientDocument.findMany({
      where: { clientId: id },
      orderBy: { uploadDate: 'desc' },
    });
    
    return NextResponse.json(documents);
  } catch (error) {
    console.error('Error fetching documents:', error);
    return NextResponse.json(
      { error: 'Failed to fetch documents' },
      { status: 500 }
    );
  }
}

// POST upload new document
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const documentType = formData.get('documentType') as string;
    const description = formData.get('description') as string;
    
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }
    
    // Verify client exists
    const client = await database.brokerClient.findUnique({
      where: { id },
    });
    
    if (!client) {
      return NextResponse.json(
        { error: 'Client not found' },
        { status: 404 }
      );
    }
    
    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    // Generate unique key for file
    const timestamp = Date.now();
    const key = `clients/${id}/${timestamp}-${file.name}`;
    
    // Upload to DO Spaces
    const fileUrl = await uploadToSpaces(key, buffer, file.type);
    
    // Save document metadata to database
    const document = await database.brokerClientDocument.create({
      data: {
        clientId: id,
        fileName: file.name,
        fileType: file.type,
        fileUrl,
        documentType,
        description,
      },
    });
    
    return NextResponse.json(document, { status: 201 });
  } catch (error) {
    console.error('Error uploading document:', error);
    return NextResponse.json(
      { error: 'Failed to upload document' },
      { status: 500 }
    );
  }
}