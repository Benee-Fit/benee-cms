import { config, withAnalyzer } from '@repo/next-config';
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  ...config,
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Keep the basic configuration while avoiding experimental options that might cause TypeScript errors
  distDir: '.next',
  images: {
    ...config.images,
    remotePatterns: [
      ...(config.images?.remotePatterns || []),
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
    ],
  },
};

export default process.env.ANALYZE === 'true' ? withAnalyzer(nextConfig) : nextConfig;