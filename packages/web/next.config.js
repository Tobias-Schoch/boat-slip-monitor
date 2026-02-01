const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@website-monitor/shared', '@website-monitor/database'],
  serverExternalPackages: ['postgres'],
  output: 'standalone'
};

module.exports = nextConfig;
