import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@foodhub/ui', '@foodhub/types', '@foodhub/utils', '@foodhub/hooks', '@foodhub/api-client', '@foodhub/config'],
};

export default nextConfig;
