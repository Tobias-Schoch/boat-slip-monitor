/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@boat-monitor/shared', '@boat-monitor/database'],
  experimental: {
    serverComponentsExternalPackages: ['postgres']
  }
};

module.exports = nextConfig;
