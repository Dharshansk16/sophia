import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Disable React strict mode to reduce hydration warnings
  reactStrictMode: false,
  
  // Additional configuration for hydration
  compiler: {
    removeConsole: process.env.NODE_ENV === "production",
  },
};

export default nextConfig;
