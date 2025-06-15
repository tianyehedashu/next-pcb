# Chatwoot 迁移检查清单

## ✅ 已完成的修改

### 1. 核心架构
- ✅ 创建了 `app/components/ChatwootProvider.tsx` (新的主要 Provider)
- ✅ 创建了 `lib/chatwoot-sdk-loader-local.ts` (本地 SDK 加载器)
- ✅ 创建了 `lib/hooks/useChatwoot.ts` (统一的 hook，向后兼容)
- ✅ 删除了 `components/ChatwootProvider.tsx` (旧的 Provider)

### 2. 本地 SDK 文件
- ✅ 下载了 SDK 到 `public/chatwoot/sdk.js`
- ✅ 创建了自动更新脚本 `scripts/update-chatwoot-sdk.ps1`

### 3. 组件更新
- ✅ 更新了 `components/FloatingCustomerServiceButton.tsx` 使用新的 hook
- ✅ 更新了 `components/examples/CustomerServiceExample.tsx` 使用新的 hook
- ✅ 确认了 `app/components/ChatwootUserSyncer.tsx` 正常工作
- ✅ 确认了 `app/components/ChatwootWidget.tsx` 正常工作

### 4. 布局和配置
- ✅ 确认了 `app/layout.tsx` 正确配置 ChatwootProvider
- ✅ 确认了 `app/components/Providers.tsx` 包含 ChatwootUserSyncer

### 5. 类型定义
- ✅ 更新了 `declarations.d.ts` 添加 Chatwoot 全局类型

### 6. 测试和调试
- ✅ 创建了 `/test-local-chatwoot` 测试页面
- ✅ 创建了 `/test-conversation-history` 测试页面
- ✅ 创建了 `ChatwootDebugInfo.tsx` 调试组件

### 7. 文档
- ✅ 创建了 `docs/CHATWOOT_CORS_SOLUTION.md`
- ✅ 创建了 `docs/CHATWOOT_ARCHITECTURE_UPDATE.md`
- ✅ 创建了本检查清单

## 🔍 需要验证的地方

### 1. 环境变量
确保以下环境变量正确设置：
```env
NEXT_PUBLIC_CHATWOOT_BASE_URL=http://www.leodennis.top:3000
NEXT_PUBLIC_CHATWOOT_WEBSITE_TOKEN=your_token_here
```

### 2. 文件存在性检查
- [ ] `public/chatwoot/sdk.js` 文件存在且可访问
- [ ] `app/components/ChatwootProvider.tsx` 正常工作
- [ ] `lib/hooks/useChatwoot.ts` 导出正确

### 3. 功能测试
- [ ] Chatwoot widget 正常显示
- [ ] 用户登录后对话历史保持
- [ ] 匿名对话在登录后正确合并
- [ ] 跨页面导航时 widget 状态保持

### 4. 性能检查
- [ ] 页面加载速度正常
- [ ] 没有 CORS 错误
- [ ] 没有 JavaScript 错误

## 🚨 潜在问题点

### 1. 导入路径
确保所有组件都使用正确的导入路径：
```typescript
// 正确的导入
import { useChatwoot } from '@/lib/hooks/useChatwoot';
import { ChatwootProvider } from '@/app/components/ChatwootProvider';

// 错误的导入（已删除）
import { useChatwoot } from '@/lib/hooks/useChatwootOptimized';
import { ChatwootProvider } from '@/components/ChatwootProvider';
```

### 2. 旧组件引用
检查是否还有地方引用了已删除的组件：
- `components/ChatwootProvider.tsx` (已删除)
- `lib/hooks/useChatwootOptimized.ts` (不存在)
- `components/ChatwootWidgetOptimized.tsx` (不存在)

### 3. 全局对象
确保 `window.$chatwoot` 正确初始化和使用。

## 📋 测试步骤

### 1. 基本功能测试
1. 访问网站首页
2. 检查右下角是否显示客服按钮
3. 点击按钮打开聊天窗口
4. 发送测试消息

### 2. 用户同步测试
1. 以匿名用户身份发送消息
2. 登录用户账户
3. 检查对话历史是否保持
4. 注销后再次登录，检查历史是否还在

### 3. 跨页面测试
1. 在一个页面打开聊天窗口
2. 导航到另一个页面
3. 检查聊天窗口状态是否保持

### 4. 错误处理测试
1. 暂时删除 `public/chatwoot/sdk.js`
2. 刷新页面，检查错误处理
3. 恢复文件，检查是否自动恢复

## 🔧 故障排查

### 如果 Widget 不显示
1. 检查浏览器控制台是否有错误
2. 检查 `public/chatwoot/sdk.js` 是否存在
3. 检查环境变量是否正确
4. 访问 `/test-local-chatwoot` 进行诊断

### 如果对话历史丢失
1. 检查 `ChatwootUserSyncer` 是否正常工作
2. 检查用户 ID 是否正确传递
3. 访问 `/test-conversation-history` 进行测试

### 如果出现 CORS 错误
1. 确认使用的是本地 SDK 文件
2. 检查 `lib/chatwoot-sdk-loader-local.ts` 是否正确加载
3. 确认没有从外部 URL 加载 SDK

## 📝 维护任务

### 定期任务
- [ ] 每月运行 `scripts/update-chatwoot-sdk.ps1` 更新 SDK
- [ ] 检查 Chatwoot 服务器状态
- [ ] 监控错误日志

### 升级任务
- [ ] 关注 Chatwoot 新版本发布
- [ ] 测试新功能兼容性
- [ ] 更新文档

## ✅ 最终确认

在部署到生产环境前，确认：
- [ ] 所有测试通过
- [ ] 没有 TypeScript 错误
- [ ] 没有 ESLint 错误
- [ ] 性能测试通过
- [ ] 用户体验测试通过

---

**注意**：此检查清单应在每次 Chatwoot 相关修改后使用，确保系统稳定性。 