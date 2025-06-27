import type { NextConfig } from 'next';
import { execSync } from 'child_process';

// 获取 Git 提交哈希
const getGitSha = (): string => {
  try {
    return execSync('git rev-parse --short HEAD').toString().trim();
  } catch {
    return '1.0.0';
  }
};

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_GIT_SHA: getGitSha(),
  },
  // 性能优化配置
  images: {
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60 * 60 * 24 * 30, // 30天缓存
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  experimental: {
    optimizePackageImports: ['@/components/ui', '@/lib'],
  },
  // 压缩配置
  compress: true,
  // 异步加载
  modularizeImports: {
    '@/components/ui': {
      transform: '@/components/ui/{{member}}',
    },
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  webpack: (config, { isServer }) => {
    // 为服务器端构建处理 nodemailer 依赖
    if (isServer) {
      config.externals.push({
        'utf-8-validate': 'commonjs utf-8-validate',
        'bufferutil': 'commonjs bufferutil',
      });
    }
    
    // 处理 Node.js 模块的 polyfill
    config.resolve.fallback = {
      ...config.resolve.fallback,
      stream: require.resolve('stream-browserify'),
      buffer: require.resolve('buffer'),
      util: require.resolve('util'),
      assert: require.resolve('assert'),
      http: require.resolve('stream-http'),
      https: require.resolve('https-browserify'),
      os: require.resolve('os-browserify/browser'),
      url: require.resolve('url'),
    };

    return config;
  },
};

export default nextConfig; 