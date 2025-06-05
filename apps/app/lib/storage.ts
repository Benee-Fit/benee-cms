import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

// Initialize the S3 client with DigitalOcean Spaces
const s3Client = new S3Client({
  endpoint: `https://${process.env.DO_SPACES_REGION}.digitaloceanspaces.com`,
  region: process.env.DO_SPACES_REGION || 'tor1',
  credentials: {
    accessKeyId: process.env.DO_SPACES_KEY || '',
    secretAccessKey: process.env.DO_SPACES_SECRET || '',
  },
});

const BUCKET_NAME = process.env.DO_SPACES_BUCKET || 'quote-pdf';

// Custom error class for storage operations
class StorageError extends Error {
  readonly code: string;
  
  constructor(message: string, code = 'STORAGE_ERROR') {
    super(message);
    this.name = 'StorageError';
    this.code = code;
  }
}

// Interfaces
export interface FileUploadOptions {
  userId: string;
  file: Buffer;
  filename: string;
  contentType: string;
  type?: 'upload' | 'processed' | 'temp';
}

export interface FileUrlOptions {
  userId: string;
  filename: string;
  type?: 'upload' | 'processed' | 'temp';
  expiresIn?: number;
}

// Internal helper functions
function generateFilePath(userId: string, filename: string, type: 'upload' | 'processed' | 'temp' = 'upload'): string {
  return `users/${userId}/${type}s/${Date.now()}-${filename}`.toLowerCase();
}

async function streamToBuffer(stream: NodeJS.ReadableStream): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Uint8Array[] = [];
    stream.on('data', (chunk) => chunks.push(chunk));
    stream.on('error', reject);
    stream.on('end', () => resolve(Buffer.concat(chunks)));
  });
}

// Public API
export async function uploadFile({
  userId,
  file,
  filename,
  contentType,
  type = 'upload',
}: FileUploadOptions): Promise<{ url: string; key: string }> {
  const key = generateFilePath(userId, filename, type);
  
  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    Body: file,
    ContentType: contentType,
    ACL: 'private',
  });

  try {
    await s3Client.send(command);
    return {
      url: `https://${BUCKET_NAME}.${process.env.DO_SPACES_REGION}.digitaloceanspaces.com/${key}`,
      key,
    };
  } catch (error) {
    throw new StorageError(
      `Failed to upload file: ${error instanceof Error ? error.message : 'Unknown error'}`,
      'UPLOAD_ERROR'
    );
  }
}

export async function getFileUrl({
  userId,
  filename,
  type = 'upload',
  expiresIn = 3600, // 1 hour
}: FileUrlOptions): Promise<string> {
  const key = generateFilePath(userId, filename, type);
  
  const command = new GetObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
  });

  try {
    return await getSignedUrl(s3Client, command, { expiresIn });
  } catch (error) {
    throw new StorageError(
      `Failed to generate file URL: ${error instanceof Error ? error.message : 'Unknown error'}`,
      'URL_GENERATION_ERROR'
    );
  }
}

export async function deleteFile(key: string): Promise<void> {
  const command = new DeleteObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
  });

  try {
    await s3Client.send(command);
  } catch (error) {
    throw new StorageError(
      `Failed to delete file: ${error instanceof Error ? error.message : 'Unknown error'}`,
      'DELETE_ERROR'
    );
  }
}

export { StorageError };
