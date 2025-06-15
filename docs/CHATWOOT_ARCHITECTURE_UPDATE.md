# Chatwoot 架构更新说明

## 概述

为了解决 CORS 问题并统一 Chatwoot 集成，我们对项目中的 Chatwoot 架构进行了重大更新。

## 主要变更

### 1. 本地 SDK 方案
- **问题**：跨域（CORS）错误阻止从外部服务器加载 SDK
- **解决方案**：将 SDK 下载到本地 `public/chatwoot/sdk.js`
- **优势**：完全避免 CORS 问题，更快的加载速度，更好的可靠性

### 2. 统一的架构
- **新的核心组件**：
  - `app/components/ChatwootProvider.tsx` - 主要的 Context 提供者
  - `lib/chatwoot-sdk-loader-local.ts` - 本地 SDK 加载器
  - `lib/hooks/useChatwoot.ts` - 统一的 hook，提供向后兼容的 API

### 3. 移除的组件
- `components/ChatwootProvider.tsx` - 旧的 Provider（已删除）
- `lib/hooks/useChatwootOptimized.ts` - 旧的优化 hook（不再需要）

## 当前架构

### 核心文件结构
```
app/
├── components/
│   ├── ChatwootProvider.tsx      # 主要的 Context 提供者
│   ├── ChatwootUserSyncer.tsx    # 用户信息同步
│   ├── ChatwootWidget.tsx        # Widget 组件
│   └── ChatwootDebugInfo.tsx     # 调试信息组件
├── layout.tsx                    # 根布局，包含 ChatwootProvider
└── components/Providers.tsx      # 包含 ChatwootUserSyncer

lib/
├── chatwoot-sdk-loader-local.ts  # 本地 SDK 加载器
└── hooks/
    └── useChatwoot.ts            # 统一的 hook

public/
└── chatwoot/
    └── sdk.js                    # 本地 SDK 文件

scripts/
└── update-chatwoot-sdk.ps1       # SDK 更新脚本
```

### 组件层次结构
```
RootLayout
├── ChatwootProvider (app/components)
│   └── Providers
│       ├── ChatwootUserSyncer
│       └── ChatwootWidget
└── 其他页面内容
```

## API 接口

### useChatwoot Hook
```typescript
interface ChatwootHookReturn {
  isLoaded: boolean;
  isOpen: boolean;
  isVisible: boolean;
  unreadCount: number;
  toggle: (state?: 'open' | 'close') => void;
  show: () => void;
  hide: () => void;
  setUser: (user: ChatwootUser) => void;
  setCustomAttributes: (attributes: Record<string, string | number>) => void;
  reset: () => void;
  sendMessage: (message: string) => void;
  isReady: () => boolean;
}
```

### 使用示例
```typescript
import { useChatwoot } from '@/lib/hooks/useChatwoot';

function MyComponent() {
  const { isLoaded, toggle, setUser } = useChatwoot();
  
  const handleOpenChat = () => {
    if (isLoaded) {
      toggle('open');
    }
  };
  
  const handleSetUser = () => {
    setUser({
      identifier: 'user-123',
      name: 'John Doe',
      email: 'john@example.com'
    });
  };
  
  return (
    <button onClick={handleOpenChat}>
      Open Chat
    </button>
  );
}
```

## 对话历史功能

### 工作原理
1. **用户标识**：使用 `user.id` 作为唯一标识符
2. **自动关联**：Chatwoot 自动关联相同标识符的对话
3. **跨设备支持**：支持跨设备、跨时间的历史记录保持
4. **匿名转换**：匿名对话在用户登录后自动合并

### 实现组件
- `ChatwootUserSyncer.tsx`：负责同步用户信息到 Chatwoot
- 在用户登录/注销时自动更新 Chatwoot 用户信息

## 测试和调试

### 测试页面
- `/test-local-chatwoot` - 本地 SDK 测试
- `/test-conversation-history` - 对话历史测试

### 调试工具
- `ChatwootDebugInfo.tsx` - 实时状态监控
- 浏览器控制台日志

## 维护

### SDK 更新
使用 PowerShell 脚本自动更新：
```powershell
.\scripts\update-chatwoot-sdk.ps1
```

### 环境变量
```env
NEXT_PUBLIC_CHATWOOT_BASE_URL=http://www.leodennis.top:3000
NEXT_PUBLIC_CHATWOOT_WEBSITE_TOKEN=your_token_here
```

## 迁移指南

### 从旧版本迁移
1. **更新导入**：
   ```typescript
   // 旧的
   import { useChatwoot } from '@/lib/hooks/useChatwootOptimized';
   
   // 新的
   import { useChatwoot } from '@/lib/hooks/useChatwoot';
   ```

2. **API 兼容性**：新的 `useChatwoot` hook 提供向后兼容的 API

3. **组件更新**：确保使用 `@/app/components/ChatwootProvider` 而不是旧的路径

## 故障排查

### 常见问题
1. **SDK 未加载**：检查 `public/chatwoot/sdk.js` 文件是否存在
2. **对话历史丢失**：确保 `ChatwootUserSyncer` 正常工作
3. **Widget 不显示**：检查环境变量配置

### 调试步骤
1. 打开浏览器开发者工具
2. 查看控制台日志
3. 检查网络请求
4. 使用调试组件查看状态

## 总结

新的架构提供了：
- ✅ 完全解决 CORS 问题
- ✅ 更好的性能和可靠性
- ✅ 统一的 API 接口
- ✅ 向后兼容性
- ✅ 完整的对话历史功能
- ✅ 全面的测试和调试工具 