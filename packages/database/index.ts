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

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = database;
}

export * from './generated/client';

export { Prisma } from './generated/client';
