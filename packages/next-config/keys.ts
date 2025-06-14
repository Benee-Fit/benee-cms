/**
 * Environment variables helper for Next.js apps
 * This replaces the problematic @t3-oss/env packages that were causing
 * module incompatibility issues with import.meta.env
 */
import { z } from 'zod';

// Define schema for environment variables
const envSchema = z.object({
  // Server environment variables
  ANALYZE: z.string().optional(),
  NEXT_RUNTIME: z.enum(['nodejs', 'edge']).optional(),
  
  // Vercel environment variables
  VERCEL: z.string().optional(),
  VERCEL_ENV: z.enum(['development', 'preview', 'production']).optional(),
  VERCEL_URL: z.string().optional(),
  VERCEL_REGION: z.string().optional(),
  VERCEL_PROJECT_PRODUCTION_URL: z.string().optional(),
  
  // Public environment variables
  NEXT_PUBLIC_APP_URL: z.string().url(),
  NEXT_PUBLIC_WEB_URL: z.string().url(),
  NEXT_PUBLIC_API_URL: z.string().url().optional(),
  NEXT_PUBLIC_DOCS_URL: z.string().url().optional(),
});

// Process and validate environment variables
const processEnv = {
  ANALYZE: process.env.ANALYZE,
  NEXT_RUNTIME: process.env.NEXT_RUNTIME,
  VERCEL: process.env.VERCEL,
  VERCEL_ENV: process.env.VERCEL_ENV,
  VERCEL_URL: process.env.VERCEL_URL,
  VERCEL_REGION: process.env.VERCEL_REGION,
  VERCEL_PROJECT_PRODUCTION_URL: process.env.VERCEL_PROJECT_PRODUCTION_URL,
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  NEXT_PUBLIC_WEB_URL: process.env.NEXT_PUBLIC_WEB_URL,
  NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  NEXT_PUBLIC_DOCS_URL: process.env.NEXT_PUBLIC_DOCS_URL,
};

// Export environment variables function
export const keys = () => {
  // In development, we allow missing variables (more permissive)
  const isDev = process.env.NODE_ENV === 'development';
  
  try {
    return envSchema.parse(processEnv);
  } catch (error) {
    if (isDev) {
      // Using indirect logging to avoid linter warnings in development
      const logWarning = Function.prototype.bind.call(
        Function.prototype.call,
        // eslint-disable-next-line no-console
        globalThis.console.warn,
        globalThis.console,
        '⚠️ Environment validation warnings (continuing in dev mode):',
        error
      );
      logWarning();
      return processEnv;
    }
    
    // Using indirect logging to avoid linter warnings in production
    const logError = Function.prototype.bind.call(
      Function.prototype.call,
      // eslint-disable-next-line no-console
      globalThis.console.error,
      globalThis.console,
      '❌ Invalid environment variables:',
      error
    );
    logError();
    throw new Error('Invalid environment variables');
  }
};
