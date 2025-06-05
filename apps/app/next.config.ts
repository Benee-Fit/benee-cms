import { env } from '@/env';
import { config, withAnalyzer } from '@repo/next-config';
import { withLogging, withSentry } from '@repo/observability/next-config';
import type { NextConfig } from 'next';

// Start with the base config
let nextConfig: NextConfig = {
  ...config,
  webpack: (webpackConfig, options) => {
    const { isServer } = options;
    // Handle AWS SDK properly
    if (isServer) {
      // Force AWS SDK to be bundled for server-side usage
      webpackConfig.resolve = webpackConfig.resolve || {};
      webpackConfig.resolve.alias = webpackConfig.resolve.alias || {};
      
      // Add AWS SDK packages to the list of modules that should be bundled
      const originalExternals = webpackConfig.externals || [];
      
      // Create a regex pattern for AWS SDK modules outside the function scope
      const awsSdkPattern = /^@aws-sdk/;
      
      // Define types for webpack externals
      type ExternalsContext = { context: string; request: string };
      type ExternalsCallback = (err?: Error | null, result?: string | string[]) => void;
      type ExternalsFunction = (context: ExternalsContext, request: string, callback: ExternalsCallback) => void;
      
      if (typeof originalExternals === 'function') {
        const typedExternals = originalExternals as ExternalsFunction;
        webpackConfig.externals = [
          // Type-safe externals function
          (context: ExternalsContext, request: string, callback: ExternalsCallback) => {
            if (awsSdkPattern.test(request) || request === 'node:https') {
              // Bundle AWS SDK modules instead of leaving them as external
              return callback();
            }
            // Call the original externals function
            return typedExternals(context, request, callback);
          },
        ];
      } else {
        // Handle array of externals
        webpackConfig.externals = (originalExternals as Array<string | RegExp | object>).filter(external => 
          !(typeof external === 'string' && (external.includes('@aws-sdk') || external === 'node:https'))
        );
      }
    }

    // If there was a custom webpack function in the original config, call it
    if (typeof config.webpack === 'function') {
      return config.webpack(webpackConfig, options);
    }
    return webpackConfig;
  },
};

// Apply middleware
nextConfig = withLogging(nextConfig);

if (env.VERCEL) {
  nextConfig = withSentry(nextConfig);
}

if (env.ANALYZE === 'true') {
  nextConfig = withAnalyzer(nextConfig);
}

export default nextConfig;
