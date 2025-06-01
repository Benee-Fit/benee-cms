// Database configuration for DigitalOcean PostgreSQL
import 'server-only';

import { PrismaClient } from './generated/client';
import { keys } from './keys';

// Prevent multiple instances during dev with HMR
const globalForPrisma = global as unknown as {
  prisma: PrismaClient | undefined;
};

const dbUrl = keys().DATABASE_URL;

// Validate that we have a DATABASE_URL
if (!dbUrl) {
  throw new Error(
    'DATABASE_URL environment variable is not set. Please check your .env file.'
  );
}

// Connection initialization happens in development mode
if (process.env.NODE_ENV !== 'production') {
  // Connection testing will happen through validateConnection function
}

// Create a configured PrismaClient instance with smart logging and connection handling
export const database =
  globalForPrisma.prisma ||
  new PrismaClient({
    datasourceUrl: dbUrl,
    log:
      process.env.NODE_ENV !== 'production'
        ? [
            { emit: 'stdout', level: 'query' },
            { emit: 'stdout', level: 'info' },
            { emit: 'stdout', level: 'warn' },
            { emit: 'stdout', level: 'error' },
          ]
        : [
            { emit: 'stdout', level: 'warn' },
            { emit: 'stdout', level: 'error' },
          ],
  });

// Add connection testing and validation
const validateConnection = async () => {
  if (process.env.NODE_ENV !== 'production') {
    try {
      await database.$connect();
      // We're keeping this log statement for development troubleshooting
      if (process.env.DEBUG) {
        // eslint-disable-next-line no-console
        console.info('[Database] Successfully connected to PostgreSQL');
      }
    } catch (e) {
      // Use standard console.error here as this is critical system information
      // eslint-disable-next-line no-console
      console.error(
        '[Database] Error connecting to PostgreSQL:',
        e instanceof Error ? e.message : String(e)
      );
      // Don't throw - let application handle errors when using the client
    }
  }
};

// Start connection validation without blocking
if (process.env.NODE_ENV !== 'production') {
  validateConnection().catch(() => {
    // Intentionally empty - errors are already logged in validateConnection
  });
}

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = database;
}

export * from './generated/client';

export { Prisma } from './generated/client';
