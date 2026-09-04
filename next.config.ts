import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The Dockerfile serves .next/standalone, but Vercel packages the server
  // itself and its build step reads the default output layout — "standalone"
  // relocates the trace files and fails it. VERCEL is set on Vercel builds.
  output: process.env.VERCEL ? undefined : "standalone",
  poweredByHeader: false,
  reactStrictMode: true,
};

export default nextConfig;
