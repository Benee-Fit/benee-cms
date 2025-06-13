import { keys as analytics } from '@repo/analytics/keys';
import { keys as auth } from '@repo/auth/keys';
import { keys as database } from '@repo/database/keys';
import { keys as core } from '@repo/next-config/keys';
import { keys as security } from '@repo/security/keys';
import { createEnv } from '@t3-oss/env-nextjs';
import { z } from 'zod';

export const env = createEnv({
  extends: [
    auth(),
    analytics(),
    core(),
    database(),
    security(),
  ],
  server: {
    DO_SPACES_KEY: z.string().min(1),
    DO_SPACES_SECRET: z.string().min(1),
    DO_SPACES_ENDPOINT: z.string().url(),
    DO_SPACES_BUCKET: z.string().min(1),
    DO_SPACES_REGION: z.string().min(1),
    GOOGLE_GENAI_API_KEY: z.string().min(1),
  },
  client: {},
  runtimeEnv: {
    DO_SPACES_KEY: process.env.DO_SPACES_KEY,
    DO_SPACES_SECRET: process.env.DO_SPACES_SECRET,
    DO_SPACES_ENDPOINT: process.env.DO_SPACES_ENDPOINT,
    DO_SPACES_BUCKET: process.env.DO_SPACES_BUCKET,
    DO_SPACES_REGION: process.env.DO_SPACES_REGION,
    GOOGLE_GENAI_API_KEY: process.env.GOOGLE_GENAI_API_KEY,
  },
});
