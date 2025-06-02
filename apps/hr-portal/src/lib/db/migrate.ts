import { db, retryOperation } from '.';
import { documents } from './schema';
import { sql } from 'drizzle-orm';

/**
 * Initialize the database schema
 * This function creates the documents table if it doesn't exist
 */
export async function initializeDatabase() {
  try {
    console.log('Initializing database schema...');
    
    // Create the documents table if it doesn't exist with retry logic
    await retryOperation(async () => {
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS "documents" (
          "id" SERIAL PRIMARY KEY,
          "uuid" TEXT NOT NULL UNIQUE,
          "file_name" TEXT NOT NULL,
          "title" TEXT NOT NULL,
          "document_type" TEXT NOT NULL,
          "upload_date" TIMESTAMP DEFAULT NOW() NOT NULL,
          "size" INTEGER NOT NULL,
          "path" TEXT NOT NULL,
          "created_at" TIMESTAMP DEFAULT NOW() NOT NULL,
          "updated_at" TIMESTAMP DEFAULT NOW() NOT NULL
        );
      `);
    });
    
    console.log('Database schema initialized successfully');
  } catch (error) {
    console.error('Error initializing database schema:', error);
    throw error; // Re-throw to allow proper error handling in the API route
  }
}
