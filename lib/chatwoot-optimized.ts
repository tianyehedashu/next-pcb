// 优化版本的 Chatwoot 配置
export const CHATWOOT_CONFIG = {
  websiteToken: process.env.NEXT_PUBLIC_CHATWOOT_WEBSITE_TOKEN || '',
  baseUrl: process.env.NEXT_PUBLIC_CHATWOOT_BASE_URL || 'https://app.chatwoot.com',
  locale: 'en',
  position: 'right' as const,
  type: 'standard' as const,
  launcherTitle: 'Customer Support',
  hideMessageBubble: true,
  showPopoutButton: false, // 修复: 禁用弹出按钮以避免 X-Frame-Options 错误
  enabledFeatures: ['emoji_picker', 'file_upload', 'attachments'] as const,
  
  // 性能优化配置
  performance: {
    preload: true, // 预加载脚本
    retryAttempts: 3, // 重试次数
    retryDelay: 1000, // 重试延迟 (ms)
    timeout: 10000, // 超时时间 (ms)
    enableCaching: true, // 启用缓存
  },
  
  // 用户体验配置
  ux: {
    showTypingIndicator: true,
    enableSoundNotifications: false,
    autoOpenDelay: 0, // 自动打开延迟 (0 = 禁用)
    welcomeMessage: 'Hi! How can we help you today?',
  },
  
  // 调试配置
  debug: {
    enabled: process.env.NODE_ENV === 'development',
    logLevel: 'info' as 'error' | 'warn' | 'info' | 'debug',
  }
} as const;

export type ChatwootConfig = typeof CHATWOOT_CONFIG;

// 配置验证函数
export const validateConfig = (): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (!CHATWOOT_CONFIG.websiteToken) {
    errors.push('Website token is required');
  }
  
  if (!CHATWOOT_CONFIG.baseUrl) {
    errors.push('Base URL is required');
  }
  
  try {
    new URL(CHATWOOT_CONFIG.baseUrl);
  } catch {
    errors.push('Invalid base URL format');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// 性能监控
export const performanceMonitor = {
  startTime: 0,
  
  start() {
    this.startTime = performance.now();
  },
  
  end(operation: string) {
    const duration = performance.now() - this.startTime;
    if (CHATWOOT_CONFIG.debug.enabled) {
      console.log(`[Chatwoot] ${operation} took ${duration.toFixed(2)}ms`);
    }
    return duration;
  }
}; 