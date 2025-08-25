import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable experimental features for better TypeScript support
  experimental: {
    turbo: {
      resolveExtensions: ['.tsx', '.ts', '.jsx', '.js', '.json']
    }
  },
  
  // Configure webpack to handle imports from parent directories
  webpack: (config, { buildId, dev, isServer, defaultLoaders, nextRuntime, webpack }) => {
    // Allow imports from parent directories
    config.resolve.alias = {
      ...config.resolve.alias,
      '@budget-agents': '../src/agents/budget',
      '@agents': '../src/agents',
      '@src': '../src'
    };

    // Handle .ts files from parent directories
    config.resolve.extensions.push('.ts', '.tsx');
    
    // Handle ESM modules
    config.resolve.extensionAlias = {
      '.js': ['.ts', '.tsx', '.js', '.jsx'],
      '.jsx': ['.tsx', '.jsx'],
      '.mjs': ['.mts', '.mjs']
    };
    
    return config;
  },

  // Environment variables
  env: {
    GOOGLE_GENERATIVE_AI_API_KEY: process.env.GOOGLE_GENERATIVE_AI_API_KEY || 'AIzaSyA3JOFk4ZL7jiTtd-eodK_LgNS-nG0OcSI',
    NEXT_PUBLIC_GOOGLE_AI_API_KEY: process.env.GOOGLE_GENERATIVE_AI_API_KEY || 'AIzaSyA3JOFk4ZL7jiTtd-eodK_LgNS-nG0OcSI',
  }
};

export default nextConfig;
