import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema';

// Development fallback connection string - only for development purposes
// In production, this should be set in the environment variables
const DEV_DB_URL = 'postgresql://postgres:postgres@localhost:5432/hr_portal';

// Get database URL from environment or use fallback for development
const dbUrl = process.env.DATABASE_URL || DEV_DB_URL;

// Log database connection status
if (!process.env.DATABASE_URL) {
  console.warn('DATABASE_URL is not set. Using development fallback connection.');
}

// Create a SQL client with Neon
const sql = neon(dbUrl);

// Create a Drizzle client
export const db = drizzle(sql, { schema });

/**
 * Retry a database operation with exponential backoff
 * @param operation The database operation to retry
 * @param maxRetries Maximum number of retries
 * @param initialDelay Initial delay in ms
 */
export async function retryOperation<T>(
  operation: () => Promise<T>,
  maxRetries = 3,
  initialDelay = 500
): Promise<T> {
  let retries = 0;
  let delay = initialDelay;
  
  while (true) {
    try {
      return await operation();
    } catch (error: any) {
      // Check if this is a rate limit error
      const isRateLimit = error?.message?.includes('rate limit') || 
                         error?.sourceError?.message?.includes('rate limit');
      
      if (!isRateLimit || retries >= maxRetries) {
        throw error;
      }
      
      // Increment retry count
      retries++;
      
      // Wait with exponential backoff
      console.log(`Rate limit hit, retrying in ${delay}ms (attempt ${retries}/${maxRetries})`);
      await new Promise(resolve => setTimeout(resolve, delay));
      
      // Exponential backoff
      delay *= 2;
    }
  }
}

// Export the schema
export { schema };
