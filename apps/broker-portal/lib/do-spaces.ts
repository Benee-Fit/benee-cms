import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { env } from '../env';

export const spacesClient = new S3Client({
  endpoint: env.DO_SPACES_ENDPOINT,
  region: env.DO_SPACES_REGION,
  credentials: {
    accessKeyId: env.DO_SPACES_KEY,
    secretAccessKey: env.DO_SPACES_SECRET,
  },
  forcePathStyle: false, // Use virtual-hosted-style URLs
});

export async function uploadToSpaces(
  key: string,
  body: Buffer | Uint8Array | string,
  contentType: string
): Promise<string> {
  const command = new PutObjectCommand({
    Bucket: env.DO_SPACES_BUCKET,
    Key: key,
    Body: body,
    ContentType: contentType,
    ACL: 'public-read',
  });

  await spacesClient.send(command);
  
  return `${env.DO_SPACES_ENDPOINT}/${env.DO_SPACES_BUCKET}/${key}`;
}

export async function deleteFromSpaces(key: string): Promise<void> {
  const command = new DeleteObjectCommand({
    Bucket: env.DO_SPACES_BUCKET,
    Key: key,
  });

  await spacesClient.send(command);
}