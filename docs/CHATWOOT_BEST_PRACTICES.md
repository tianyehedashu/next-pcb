# Chatwoot 与 Next.js 集成最佳实践指南

## 📋 概述

本指南提供了 Chatwoot 与 Next.js 集成的最佳实践，包括性能优化、错误处理、用户体验改进等方面的建议。

## 🏗️ 架构设计最佳实践

### 1. 分层架构

```
├── lib/
│   ├── chatwoot-optimized.ts      # 配置和工具函数
│   └── hooks/
│       └── useChatwootOptimized.ts # 优化的 Hook
├── components/
│   ├── ChatwootProvider.tsx        # Context Provider
│   ├── ChatwootWidgetOptimized.tsx # 优化的 Widget 组件
│   └── custom-ui/
│       └── FloatingChatButton.tsx  # 自定义 UI 组件
└── types/
    └── chatwoot.d.ts              # TypeScript 类型定义
```

### 2. 配置管理

**✅ 推荐做法：**
```typescript
// 集中配置管理
export const CHATWOOT_CONFIG = {
  // 基础配置
  websiteToken: process.env.NEXT_PUBLIC_CHATWOOT_WEBSITE_TOKEN || '',
  baseUrl: process.env.NEXT_PUBLIC_CHATWOOT_BASE_URL || 'https://app.chatwoot.com',
  
  // 性能配置
  performance: {
    preload: true,
    retryAttempts: 3,
    timeout: 10000,
  },
  
  // 用户体验配置
  ux: {
    autoOpenDelay: 0,
    welcomeMessage: 'Hi! How can we help you today?',
  }
} as const;
```

**❌ 避免做法：**
```typescript
// 硬编码配置
const websiteToken = "abc123"; // 不要硬编码敏感信息
const baseUrl = "https://app.chatwoot.com"; // 不要硬编码 URL
```

## 🚀 性能优化最佳实践

### 1. 脚本加载优化

**✅ 推荐做法：**
```typescript
// 异步加载 + 预加载
const script = document.createElement('script');
script.async = true;
script.defer = true;
if (CHATWOOT_CONFIG.performance.preload) {
  script.rel = 'preload';
}
script.src = `${baseUrl}/packs/js/sdk.js`;
```

**❌ 避免做法：**
```typescript
// 同步加载（阻塞渲染）
const script = document.createElement('script');
script.src = `${baseUrl}/packs/js/sdk.js`;
// 没有设置 async 或 defer
```

### 2. 重试机制

**✅ 推荐做法：**
```typescript
const retryWithBackoff = (attempt: number) => {
  const delay = CHATWOOT_CONFIG.performance.retryDelay * Math.pow(2, attempt);
  setTimeout(() => initializeChatwoot(), delay);
};
```

### 3. 内存管理

**✅ 推荐做法：**
```typescript
// 清理函数
const cleanup = useCallback(() => {
  if (timeoutRef.current) clearTimeout(timeoutRef.current);
  if (scriptRef.current?.parentNode) {
    scriptRef.current.parentNode.removeChild(scriptRef.current);
  }
  // 清理全局对象
  delete window.chatwootSDK;
  delete window.$chatwoot;
}, []);

useEffect(() => {
  return cleanup; // 组件卸载时清理
}, [cleanup]);
```

## 🛡️ 错误处理最佳实践

### 1. 配置验证

**✅ 推荐做法：**
```typescript
export const validateConfig = (): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (!CHATWOOT_CONFIG.websiteToken) {
    errors.push('Website token is required');
  }
  
  try {
    new URL(CHATWOOT_CONFIG.baseUrl);
  } catch {
    errors.push('Invalid base URL format');
  }
  
  return { isValid: errors.length === 0, errors };
};
```

### 2. 安全的方法调用

**✅ 推荐做法：**
```typescript
const safeExecute = useCallback(<T extends any[]>(
  method: string,
  ...args: T
): boolean => {
  if (window.$chatwoot && typeof window.$chatwoot[method] === 'function') {
    try {
      window.$chatwoot[method](...args);
      return true;
    } catch (error) {
      console.error(`Error executing ${method}:`, error);
      return false;
    }
  }
  return false;
}, []);
```

### 3. 错误边界

**✅ 推荐做法：**
```typescript
class ChatwootErrorBoundary extends React.Component {
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Chatwoot Error:', error, errorInfo);
    // 发送错误报告到监控服务
  }
  
  render() {
    if (this.state.hasError) {
      return <div>Chat service temporarily unavailable</div>;
    }
    return this.props.children;
  }
}
```

## 🎨 用户体验最佳实践

### 1. 加载状态管理

**✅ 推荐做法：**
```typescript
const ChatButton = () => {
  const { isLoaded, isLoading } = useChatwoot();
  
  return (
    <button disabled={!isLoaded}>
      {isLoading ? (
        <Spinner />
      ) : (
        <>
          <ChatIcon />
          {unreadCount > 0 && <Badge>{unreadCount}</Badge>}
        </>
      )}
    </button>
  );
};
```

### 2. 响应式设计

**✅ 推荐做法：**
```css
/* 移动端优化 */
@media (max-width: 768px) {
  .chatwoot-widget {
    bottom: 20px;
    right: 20px;
    width: calc(100vw - 40px);
    max-width: 400px;
  }
}
```

### 3. 无障碍访问

**✅ 推荐做法：**
```typescript
<button
  aria-label="Open customer support chat"
  aria-expanded={isOpen}
  role="button"
  tabIndex={0}
  onKeyDown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      toggle();
    }
  }}
>
  Chat
</button>
```

## 🔒 安全最佳实践

### 1. 环境变量管理

**✅ 推荐做法：**
```bash
# .env.local
NEXT_PUBLIC_CHATWOOT_WEBSITE_TOKEN=your_token_here
NEXT_PUBLIC_CHATWOOT_BASE_URL=https://your-chatwoot-instance.com

# .env.example
NEXT_PUBLIC_CHATWOOT_WEBSITE_TOKEN=your_website_token_here
NEXT_PUBLIC_CHATWOOT_BASE_URL=https://app.chatwoot.com
```

### 2. 用户数据保护

**✅ 推荐做法：**
```typescript
// 敏感数据脱敏
const setUserSafely = (user: ChatwootUser) => {
  const safeUser = {
    identifier: user.identifier,
    name: user.name,
    // 不要发送敏感信息如密码、信用卡等
  };
  chatwoot.setUser(safeUser);
};
```

### 3. CSP (Content Security Policy) 配置

**✅ 推荐做法：**
```javascript
// next.config.js
const nextConfig = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: `
              script-src 'self' 'unsafe-inline' https://widget.chatwoot.com;
              connect-src 'self' https://app.chatwoot.com wss://app.chatwoot.com;
            `.replace(/\s{2,}/g, ' ').trim()
          }
        ]
      }
    ];
  }
};
```

## 📊 监控和分析最佳实践

### 1. 性能监控

**✅ 推荐做法：**
```typescript
export const performanceMonitor = {
  start() {
    this.startTime = performance.now();
  },
  
  end(operation: string) {
    const duration = performance.now() - this.startTime;
    
    // 发送到分析服务
    analytics.track('chatwoot_performance', {
      operation,
      duration,
      timestamp: Date.now()
    });
    
    return duration;
  }
};
```

### 2. 用户行为分析

**✅ 推荐做法：**
```typescript
const trackChatwootEvents = () => {
  window.addEventListener('chatwoot:opened', () => {
    analytics.track('chat_opened');
  });
  
  window.addEventListener('chatwoot:closed', () => {
    analytics.track('chat_closed');
  });
};
```

## 🧪 测试最佳实践

### 1. 单元测试

**✅ 推荐做法：**
```typescript
// __tests__/useChatwoot.test.ts
import { renderHook } from '@testing-library/react';
import { useChatwootOptimized } from '../lib/hooks/useChatwootOptimized';

describe('useChatwootOptimized', () => {
  it('should initialize with correct default state', () => {
    const { result } = renderHook(() => useChatwootOptimized());
    
    expect(result.current.isLoaded).toBe(false);
    expect(result.current.isOpen).toBe(false);
  });
});
```

### 2. 集成测试

**✅ 推荐做法：**
```typescript
// e2e/chatwoot.spec.ts
import { test, expect } from '@playwright/test';

test('chatwoot widget loads and functions correctly', async ({ page }) => {
  await page.goto('/');
  
  // 等待 widget 加载
  await page.waitForSelector('[data-testid="chatwoot-widget"]');
  
  // 测试打开聊天
  await page.click('[data-testid="chat-button"]');
  await expect(page.locator('.chatwoot-widget')).toBeVisible();
});
```

## 📱 移动端优化最佳实践

### 1. 触摸友好设计

**✅ 推荐做法：**
```css
.chat-button {
  min-height: 44px; /* iOS 推荐的最小触摸目标 */
  min-width: 44px;
  padding: 12px;
}
```

### 2. 视口适配

**✅ 推荐做法：**
```typescript
const isMobile = () => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );
};

// 根据设备调整行为
if (isMobile()) {
  chatwootSettings.position = 'right';
  chatwootSettings.type = 'expanded_bubble';
}
```

## 🌐 国际化最佳实践

### 1. 多语言支持

**✅ 推荐做法：**
```typescript
const getChatwootLocale = (userLocale: string): string => {
  const supportedLocales = ['en', 'es', 'fr', 'de', 'zh', 'ja'];
  const locale = userLocale.split('-')[0];
  return supportedLocales.includes(locale) ? locale : 'en';
};

// 设置语言
chatwoot.setLocale(getChatwootLocale(navigator.language));
```

## 🔧 部署最佳实践

### 1. 环境配置

**✅ 推荐做法：**
```bash
# 生产环境
NEXT_PUBLIC_CHATWOOT_WEBSITE_TOKEN=prod_token_here
NEXT_PUBLIC_CHATWOOT_BASE_URL=https://chat.yourdomain.com

# 开发环境
NEXT_PUBLIC_CHATWOOT_WEBSITE_TOKEN=dev_token_here
NEXT_PUBLIC_CHATWOOT_BASE_URL=https://dev-chat.yourdomain.com
```

### 2. CDN 优化

**✅ 推荐做法：**
```typescript
// 使用 CDN 加速脚本加载
const getCDNUrl = (baseUrl: string): string => {
  if (process.env.NODE_ENV === 'production') {
    return `https://cdn.yourdomain.com/chatwoot/sdk.js`;
  }
  return `${baseUrl}/packs/js/sdk.js`;
};
```

## 📈 性能指标

### 关键指标监控

1. **脚本加载时间** - 应 < 2 秒
2. **初始化时间** - 应 < 1 秒
3. **首次交互时间** - 应 < 500ms
4. **错误率** - 应 < 1%
5. **用户满意度** - 通过聊天评分监控

### 性能优化检查清单

- [ ] 脚本异步加载
- [ ] 实现重试机制
- [ ] 添加超时处理
- [ ] 内存泄漏检查
- [ ] 移动端优化
- [ ] 错误边界设置
- [ ] 性能监控集成
- [ ] 用户体验测试

## 🎯 总结

通过遵循这些最佳实践，你可以：

1. **提升性能** - 减少加载时间，提高响应速度
2. **增强稳定性** - 更好的错误处理和恢复机制
3. **改善用户体验** - 流畅的交互和友好的界面
4. **确保安全性** - 保护用户数据和系统安全
5. **便于维护** - 清晰的架构和完善的测试

记住，最佳实践是不断演进的，建议定期回顾和更新你的实现方式。 