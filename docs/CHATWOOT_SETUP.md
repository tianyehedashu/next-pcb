# Chatwoot 配置指南

本项目已集成 Chatwoot 客服系统，支持在线客服聊天功能。

## 环境变量配置

在项目根目录创建 `.env.local` 文件，添加以下环境变量：

```env
NEXT_PUBLIC_CHATWOOT_WEBSITE_TOKEN=your_website_token_here
NEXT_PUBLIC_CHATWOOT_BASE_URL=https://app.chatwoot.com
```

### 获取 Website Token

1. 登录您的 Chatwoot 管理后台
2. 进入 **Settings** → **Inboxes**
3. 选择或创建一个 Website 类型的收件箱
4. 在收件箱设置中找到 **Website Token**
5. 复制该 Token 并添加到环境变量中

## 文件结构

```
├── lib/
│   ├── chatwoot.ts              # Chatwoot 配置文件
│   └── hooks/
│       └── useChatwoot.ts       # Chatwoot 自定义 Hook
├── components/
│   ├── ChatwootWidget.tsx                    # Chatwoot SDK 集成
│   ├── FloatingCustomerServiceButton.tsx     # 浮动客服按钮
│   └── examples/
│       └── CustomerServiceExample.tsx        # 使用示例
├── types/
│   └── chatwoot.d.ts           # TypeScript 类型定义
└── app/
    ├── layout.tsx              # 已集成 ChatwootWidget
    └── test-chatwoot/
        └── page.tsx            # 测试页面
```

## 基本使用

### 1. 自动浮动按钮

浮动客服按钮已添加到 `app/layout.tsx` 中，会在所有页面右下角显示。

### 2. 编程控制

使用 `useChatwoot` Hook 来控制聊天窗口：

```tsx
import { useChatwoot } from '@/lib/hooks/useChatwoot';

export default function MyComponent() {
  const { isLoaded, toggle, setUser, setCustomAttributes } = useChatwoot();

  const openChat = () => {
    toggle('open');
  };

  const setUserInfo = () => {
    setUser({
      identifier: 'user123',
      name: 'John Doe',
      email: 'john@example.com',
    });
  };

  return (
    <div>
      {isLoaded && (
        <button onClick={openChat}>
          Open Customer Support
        </button>
      )}
    </div>
  );
}
```

## 配置选项

在 `lib/chatwoot.ts` 中可以修改以下配置：

```typescript
export const CHATWOOT_CONFIG = {
  websiteToken: process.env.NEXT_PUBLIC_CHATWOOT_WEBSITE_TOKEN || '',
  baseUrl: process.env.NEXT_PUBLIC_CHATWOOT_BASE_URL || 'https://app.chatwoot.com',
  locale: 'en',                    // 界面语言
  position: 'right',               // 聊天按钮位置: 'left' | 'right'
  type: 'standard',                // 类型: 'standard' | 'expanded_bubble'
  launcherTitle: 'Customer Support', // 聊天按钮标题
  hideMessageBubble: true,         // 隐藏默认按钮，使用自定义浮动按钮
  showPopoutButton: true,          // 是否显示弹出按钮
};
```

## 测试集成

访问 `/test-chatwoot` 页面来测试 Chatwoot 集成是否正常工作。

## 高级功能

### 设置用户信息

```tsx
const { setUser } = useChatwoot();

setUser({
  identifier: 'unique_user_id',
  name: 'User Name',
  email: 'user@example.com',
  avatar_url: 'https://example.com/avatar.jpg',
  phone_number: '+1234567890',
});
```

### 设置自定义属性

```tsx
const { setCustomAttributes } = useChatwoot();

setCustomAttributes({
  plan: 'premium',
  company: 'Acme Corp',
  role: 'admin',
});
```

### 重置聊天状态

```tsx
const { reset } = useChatwoot();

// 重置用户会话
reset();
```

## 故障排除

### 1. 聊天窗口不显示

**检查环境变量**
```bash
# 确保 .env.local 文件存在并包含正确的值
NEXT_PUBLIC_CHATWOOT_WEBSITE_TOKEN=your_actual_token
NEXT_PUBLIC_CHATWOOT_BASE_URL=https://app.chatwoot.com
```

**验证 Website Token**
- 登录 Chatwoot 管理后台
- 检查 Settings → Inboxes 中的 Website Token 是否正确
- 确保 inbox 状态为 "Active"

**检查控制台错误**
- 打开浏览器开发者工具
- 查看 Console 标签页是否有错误信息
- 查看 Network 标签页确认 SDK 脚本是否加载成功

### 2. 浮动按钮不显示

**检查组件加载**
- 确认 `FloatingCustomerServiceButton` 已添加到 `app/layout.tsx`
- 检查是否有 CSS 样式冲突
- 确认 `z-index` 设置正确（当前为 50）

**检查状态**
- 浮动按钮在页面加载 1 秒后显示
- 绿色指示器表示 Chatwoot 已就绪
- 灰色指示器表示正在加载中

### 3. 点击按钮无反应

**检查 Chatwoot 加载状态**
```tsx
const { isLoaded, isOpen } = useChatwoot();
console.log('Chatwoot loaded:', isLoaded);
console.log('Chat open:', isOpen);
console.log('$chatwoot available:', !!window.$chatwoot);
```

**手动测试**
```javascript
// 在浏览器控制台中运行
if (window.$chatwoot) {
  window.$chatwoot.toggle('open');
} else {
  console.log('Chatwoot not loaded');
}
```

### 4. 网络问题

**检查网络连接**
- 确认可以访问 `https://app.chatwoot.com`
- 检查防火墙或代理设置
- 尝试在其他网络环境下测试

**自托管 Chatwoot**
```env
# 如果使用自托管的 Chatwoot
NEXT_PUBLIC_CHATWOOT_BASE_URL=https://your-chatwoot-domain.com
```

### 5. 开发环境问题

**重启开发服务器**
```bash
pnpm dev
```

**清除缓存**
```bash
# 清除 Next.js 缓存
rm -rf .next
pnpm dev
```

**检查依赖**
```bash
pnpm install
```

## 性能优化

1. **脚本异步加载** - Chatwoot 脚本异步加载，不阻塞页面渲染
2. **防重复加载** - 组件包含防重复加载机制
3. **延迟显示** - 浮动按钮延迟 1 秒显示，确保页面流畅加载
4. **事件监听** - 使用事件监听器跟踪聊天状态变化

## 注意事项

- 确保在生产环境中使用有效的 Website Token
- 建议在 Chatwoot 后台设置合适的工作时间和自动回复
- 可以根据需要在不同页面设置不同的用户属性
- 默认隐藏了 Chatwoot 原生按钮，使用自定义浮动按钮
- 浮动按钮支持悬浮提示和状态指示器 