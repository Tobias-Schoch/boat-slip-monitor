const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@boat-monitor/shared', '@boat-monitor/database'],
  serverExternalPackages: ['postgres']
};

module.exports = nextConfig;
