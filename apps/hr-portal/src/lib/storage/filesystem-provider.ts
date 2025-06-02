import { promises as fs } from 'fs';
import path from 'path';
import { DocumentMetadata, StorageProvider } from './storage-interface';
import { v4 as uuidv4 } from 'uuid';
import { db, retryOperation } from '../db';
import { documents, Document } from '../db/schema';
import { eq } from 'drizzle-orm';

// Define the directory where files will be stored
const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads');

/**
 * Filesystem implementation of the StorageProvider interface
 * Stores files in the local filesystem and metadata in Neon Postgres
 */
export class FilesystemStorageProvider implements StorageProvider {
  private async ensureUploadDir() {
    try {
      await fs.access(UPLOAD_DIR);
    } catch (error) {
      // Directory doesn't exist, create it
      await fs.mkdir(UPLOAD_DIR, { recursive: true });
    }
  }

  // Convert DB document to DocumentMetadata
  private dbDocToMetadata(doc: Document): DocumentMetadata {
    return {
      id: doc.uuid,
      fileName: doc.fileName,
      title: doc.title,
      documentType: doc.documentType,
      uploadDate: doc.uploadDate || new Date(),
      size: doc.size,
      path: doc.path
    };
  }

  async uploadFile(file: File, metadata: Partial<DocumentMetadata>): Promise<DocumentMetadata> {
    await this.ensureUploadDir();
    
    const uuid = uuidv4();
    const fileExtension = file.name.split('.').pop() || '';
    const fileName = `${uuid}.${fileExtension}`;
    const filePath = path.join(UPLOAD_DIR, fileName);
    
    // Convert File to Buffer for Node.js filesystem
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    // Save the file
    await fs.writeFile(filePath, buffer);
    
    // Create document in database
    const newDocument = {
      uuid,
      fileName: file.name,
      title: metadata.title || file.name,
      documentType: metadata.documentType || 'Other',
      uploadDate: new Date(),
      size: file.size,
      path: `/uploads/${fileName}`, // Path relative to public directory
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    // Use retry logic for database operation
    const insertedDoc = await retryOperation(async () => {
      const [doc] = await db.insert(documents).values(newDocument).returning();
      return doc;
    });
    
    return this.dbDocToMetadata(insertedDoc);
  }

  async getFile(id: string): Promise<Blob> {
    // Get document metadata from database with retry logic
    const doc = await retryOperation(async () => {
      const [document] = await db.select().from(documents).where(eq(documents.uuid, id)).limit(1);
      if (!document) {
        throw new Error(`File with ID ${id} not found`);
      }
      return document;
    });
    
    const filePath = path.join(process.cwd(), 'public', doc.path);
    const fileData = await fs.readFile(filePath);
    
    // Convert Buffer to Blob
    return new Blob([fileData]);
  }

  async deleteFile(id: string): Promise<boolean> {
    try {
      // Get document metadata from database with retry logic
      const doc = await retryOperation(async () => {
        const [document] = await db.select().from(documents).where(eq(documents.uuid, id)).limit(1);
        if (!document) {
          return null;
        }
        return document;
      });
      
      if (!doc) {
        return false;
      }
      
      const filePath = path.join(process.cwd(), 'public', doc.path);
      
      // Delete the file
      await fs.unlink(filePath).catch(err => {
        console.warn(`File not found on disk: ${filePath}`, err);
        // Continue even if file doesn't exist on disk
      });
      
      // Delete from database with retry logic
      await retryOperation(async () => {
        await db.delete(documents).where(eq(documents.uuid, id));
      });
      
      return true;
    } catch (error) {
      console.error('Error deleting file:', error);
      return false;
    }
  }

  async listFiles(): Promise<DocumentMetadata[]> {
    // Get all documents from database with retry logic
    const docs = await retryOperation(async () => {
      return await db.select().from(documents).orderBy(documents.uploadDate);
    });
    
    // Convert to DocumentMetadata
    return docs.map(doc => this.dbDocToMetadata(doc));
  }
}
