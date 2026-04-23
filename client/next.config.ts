// next.config.ts

import { NextConfig } from 'next';

const truthyValues = new Set(['1', 'true', 'yes', 'on']);

function readBooleanEnv(value: string | undefined, fallback: boolean) {
  if (typeof value !== 'string' || !value.trim()) {
    return fallback;
  }

  return truthyValues.has(value.trim().toLowerCase());
}

const protectedMode = readBooleanEnv(process.env.APP_PROTECTED_MODE, false);
const allowPublicSignup = readBooleanEnv(
  process.env.ALLOW_PUBLIC_SIGNUP,
  !protectedMode
);
const allowPasswordReset = readBooleanEnv(
  process.env.ALLOW_PASSWORD_RESET,
  !protectedMode
);

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ['gsap'],
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || '',
    NEXT_PUBLIC_ALLOW_PUBLIC_SIGNUP: `${allowPublicSignup}`,
    NEXT_PUBLIC_ALLOW_PASSWORD_RESET: `${allowPasswordReset}`,
  },
};

export default nextConfig;
