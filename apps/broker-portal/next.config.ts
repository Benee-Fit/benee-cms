import { env } from './env';
import { config, withAnalyzer } from '@repo/next-config';
import { withLogging, withSentry } from '@repo/observability/next-config';
import type { NextConfig } from 'next';

// Configure the base Next.js config
let nextConfig: NextConfig = {
  ...withLogging(config),
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Add polyfill for server-side rendering
      config.resolve.alias = {
        ...config.resolve.alias,
      };
      // Ensure polyfills are loaded first
      if (Array.isArray(config.entry)) {
        config.entry.unshift('./polyfills.ts');
      } else if (typeof config.entry === 'object') {
        for (const key in config.entry) {
          if (Array.isArray(config.entry[key])) {
            config.entry[key].unshift('./polyfills.ts');
          }
        }
      }
    }
    return config;
  },
};

if (env.VERCEL) {
  nextConfig = withSentry(nextConfig);
}

if (env.ANALYZE === 'true') {
  nextConfig = withAnalyzer(nextConfig);
}

export default nextConfig;
