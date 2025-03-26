import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true 
  },
  output: 'standalone', // 
  poweredByHeader: false, 
};

export default nextConfig;
