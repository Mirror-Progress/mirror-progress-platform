// next.config.ts

import { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || '',
  },
};

module.exports = {
  reactStrictMode: true,
  transpilePackages: ['gsap'],
};


export default nextConfig;
