import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { eq, and, or, sql } from 'drizzle-orm';

// Create a PostgreSQL connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

// Create drizzle instance
export const db = drizzle(pool);

// Helper function to execute SQL queries
export async function query(text: string, params?: any[]) {
  const client = await pool.connect();
  try {
    return await client.query(text, params);
  } finally {
    client.release();
  }
}

// Retry operation with exponential backoff
export async function retryOperation<T>(operation: () => Promise<T>, maxRetries = 3, initialDelay = 300): Promise<T> {
  let lastError: Error | undefined;
  let delay = initialDelay;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      console.warn(`Operation failed (attempt ${attempt + 1}/${maxRetries}): ${lastError.message}`);
      
      // Exponential backoff with jitter
      delay = delay * 1.5 + Math.random() * 100;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError || new Error('Max retries exceeded');
}

// Initialize the documents table with PDF.co columns if it doesn't exist
export async function initDocumentsTable() {
  // This function is maintained for compatibility, but we should be using
  // Drizzle migrations for schema changes in production
  const existingTables = await query(`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'documents'
  `);
  
  const tableExists = existingTables?.rowCount && existingTables.rowCount > 0;
  
  if (!tableExists) {
    console.log('Documents table does not exist, creating it');
    try {
      // Create the table with all required fields including PDF.co columns
      const createTableQuery = `
        CREATE TABLE IF NOT EXISTS documents (
          id SERIAL PRIMARY KEY,
          uuid TEXT UNIQUE,
          title TEXT NOT NULL,
          file_name TEXT NOT NULL,
          document_type TEXT DEFAULT 'Other',
          upload_date TIMESTAMPTZ DEFAULT NOW(),
          size INTEGER,
          path TEXT,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW(),
          pdf_co_url TEXT,
          pdf_co_id TEXT,
          file_size_kb INTEGER,
          metadata JSONB DEFAULT '{}'::JSONB
        );
      `;
      
      await query(createTableQuery);
      console.log('Documents table initialized with PDF.co columns');
    } catch (error) {
      console.error('Error initializing documents table:', error);
      throw error;
    }
  } else {
    console.log('Documents table exists, checking for PDF.co columns');
    await addPdfCoColumns();
  }
}

// Add PDF.co columns to existing documents table if they don't exist
export async function addPdfCoColumns() {
  const columnsToAdd = [
    { name: 'pdf_co_url', type: 'TEXT' },
    { name: 'pdf_co_id', type: 'TEXT' },
    { name: 'file_size_kb', type: 'INTEGER' },
    { name: 'metadata', type: 'JSONB', default: "DEFAULT '{}'::JSONB" }
  ];

  try {
    for (const column of columnsToAdd) {
      // Check if column exists
      const checkColumnQuery = `
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'documents' AND column_name = $1;
      `;
      
      const result = await query(checkColumnQuery, [column.name]);
      
      if (!result?.rowCount || result.rowCount === 0) {
        // Column doesn't exist, add it
        const addColumnQuery = `
          ALTER TABLE documents 
          ADD COLUMN IF NOT EXISTS ${column.name} ${column.type} ${column.default || ''};
        `;
        
        await query(addColumnQuery);
        console.log(`Added ${column.name} column to documents table`);
      } else {
        console.log(`Column ${column.name} already exists in documents table`);
      }
    }

    // Make sure the UUID column exists (required for the StorageProvider)
    const checkUuidColumn = await query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'documents' AND column_name = 'uuid';
    `);
    
    if (!checkUuidColumn?.rowCount || checkUuidColumn.rowCount === 0) {
      await query(`ALTER TABLE documents ADD COLUMN IF NOT EXISTS uuid TEXT UNIQUE;`);
      console.log('Added uuid column to documents table');
    }
  } catch (error) {
    console.error('Error adding PDF.co columns:', error);
    throw error;
  }
}

// Document-related functions
export async function saveDocument(data: {
  title: string;
  file_name: string;
  file_size_kb?: number;
  pdf_co_url: string;
  pdf_co_id: string;
  metadata?: any;
}) {
  const { title, file_name, file_size_kb, pdf_co_url, pdf_co_id, metadata } = data;
  
  const insertQuery = `
    INSERT INTO documents (title, file_name, file_size_kb, pdf_co_url, pdf_co_id, metadata)
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING id, pdf_co_url;
  `;
  
  const result = await query(insertQuery, [
    title,
    file_name,
    file_size_kb || null,
    pdf_co_url,
    pdf_co_id,
    metadata ? JSON.stringify(metadata) : '{}'
  ]);
  
  return result.rows[0];
}

// Get document by ID
export async function getDocumentById(id: number) {
  const getQuery = `
    SELECT * FROM documents WHERE id = $1;
  `;
  
  const result = await query(getQuery, [id]);
  return result.rows[0] || null;
}

// Get multiple documents by their IDs
export async function getDocumentsByIds(ids: number[]) {
  if (!ids.length) return [];
  
  const placeholders = ids.map((_, index) => `$${index + 1}`).join(', ');
  const getQuery = `
    SELECT * FROM documents WHERE id IN (${placeholders});
  `;
  
  const result = await query(getQuery, ids);
  return result.rows;
}
