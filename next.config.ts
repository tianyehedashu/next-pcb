import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    // !! 仅在生产构建时忽略类型错误
    ignoreBuildErrors: true,
  },
  eslint: {
    // !! 仅在生产构建时忽略 ESLint 错误
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
