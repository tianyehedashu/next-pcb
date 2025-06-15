import type { NextConfig } from "next";

const cspHeader = `
    script-src 'self' http://www.leodennis.top:3000 'unsafe-eval' 'unsafe-inline';
    connect-src 'self' http://www.leodennis.top:3000 ws://www.leodennis.top:3000;
    frame-src http://www.leodennis.top:3000;
    img-src 'self' data:;
`;

const nextConfig: NextConfig = {
  /* config options here */
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: cspHeader.replace(/\s{2,}/g, ' ').trim(),
          },
        ],
      },
    ]
  },
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
