import { db } from '.';
import { documents } from './schema';

/**
 * Test database connection and operations
 */
async function testDatabase() {
  try {
    console.log('Testing database connection...');
    
    // Test a simple query
    const docs = await db.select().from(documents);
    console.log(`Successfully connected to database. Found ${docs.length} documents.`);
    
    return { success: true, message: 'Database connection successful', documents: docs };
  } catch (error) {
    console.error('Database connection error:', error);
    return { success: false, message: 'Database connection failed', error };
  }
}

// Execute the test
testDatabase()
  .then(result => {
    console.log('Test result:', JSON.stringify(result, null, 2));
    process.exit(result.success ? 0 : 1);
  })
  .catch(error => {
    console.error('Unexpected error:', error);
    process.exit(1);
  });
