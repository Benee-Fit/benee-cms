import { env } from '@/env';
import { withCMS } from '@repo/cms/next-config';
import { config, withAnalyzer } from '@repo/next-config';
import { withLogging, withSentry } from '@repo/observability/next-config';
import type { NextConfig } from 'next';

let nextConfig: NextConfig = withLogging({
  ...config,
  // Use standalone mode for server-rendered pages and API routes
  output: 'standalone',
  // Avoid including pnpm node_modules structure in the output
  experimental: {
    // This helps avoid the pnpm dependency issues during build
    outputFileTracingExcludes: {
      '*': [
        'node_modules/.pnpm',
      ],
    },
  }, // Optimizes for containerized environments
});

nextConfig.images?.remotePatterns?.push({
  protocol: 'https',
  hostname: 'assets.basehub.com',
});

if (process.env.NODE_ENV === 'production') {
  const redirects: NextConfig['redirects'] = async () => [
    {
      source: '/legal',
      destination: '/legal/privacy',
      statusCode: 301,
    },
  ];

  nextConfig.redirects = redirects;
}

if (env.VERCEL) {
  nextConfig = withSentry(nextConfig);
}

if (env.ANALYZE === 'true') {
  nextConfig = withAnalyzer(nextConfig);
}

export default withCMS(nextConfig);
