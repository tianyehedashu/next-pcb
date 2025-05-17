const { execSync } = require('child_process');

// 获取 Git 提交哈希
const getGitSha = () => {
  try {
    return execSync('git rev-parse --short HEAD').toString().trim();
  } catch (error) {
    return '1.0.0';
  }
};

/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    NEXT_PUBLIC_GIT_SHA: getGitSha(),
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  // ... 其他配置
};

module.exports = nextConfig; 