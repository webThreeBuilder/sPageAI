import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true  // 临时忽略 TypeScript 构建错误
  },
  output: 'export',
   images: { unoptimized: true } ,
};

export default nextConfig;
