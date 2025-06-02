import type { Config } from 'drizzle-kit';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not set');
}

// Parse the connection string to extract components
const url = new URL(process.env.DATABASE_URL);
const host = url.hostname;
const port = parseInt(url.port, 10) || 5432;
const database = url.pathname.substring(1); // Remove leading slash
const user = url.username;
const password = url.password;

export default {
  schema: './src/lib/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    host,
    port,
    database,
    user,
    password,
    ssl: true,
  },
} satisfies Config;
