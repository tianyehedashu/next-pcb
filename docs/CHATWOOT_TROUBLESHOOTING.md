# Chatwoot 故障排除指南

## 常见问题及解决方案

### 1. 404 错误 - 无法加载 Chatwoot 脚本

**错误信息：**
```
Failed to load resource: the server responded with a status of 404 ()
```

**可能原因：**
- 环境变量未设置或设置错误
- Chatwoot 实例 URL 不正确
- 网络连接问题

**解决方案：**

#### 步骤 1: 检查环境变量
确保在项目根目录创建了 `.env.local` 文件：

```env
NEXT_PUBLIC_CHATWOOT_WEBSITE_TOKEN=your_actual_token_here
NEXT_PUBLIC_CHATWOOT_BASE_URL=https://app.chatwoot.com
```

#### 步骤 2: 验证 Website Token
1. 登录 Chatwoot 管理后台
2. 进入 **Settings → Inboxes**
3. 选择或创建 Website 类型的收件箱
4. 复制正确的 Website Token
5. 确保 Token 没有多余的空格或字符

#### 步骤 3: 测试网络连接
在浏览器中直接访问：
```
https://app.chatwoot.com/packs/js/sdk.js
```

如果无法访问，可能是网络问题或防火墙阻止。

### 2. X-Frame-Options 错误

**错误信息：**
```
Refused to display 'https://app.chatwoot.com/' in a frame because it set 'X-Frame-Options' to 'sameorigin'.
```

**解释：**
这个错误通常是正常的，因为 Chatwoot 聊天窗口会在新窗口或弹出层中打开，而不是在 iframe 中。

**解决方案：**
- 这个错误可以忽略，不影响功能
- 确保浮动按钮能正常显示和点击
- 检查聊天窗口是否能正常打开

### 3. 浮动按钮不显示

**可能原因：**
- Chatwoot 脚本未加载成功
- CSS 样式冲突
- JavaScript 错误

**解决方案：**

#### 检查控制台错误
1. 打开浏览器开发者工具 (F12)
2. 查看 Console 标签页的错误信息
3. 查看 Network 标签页确认脚本加载状态

#### 检查组件加载
确认 `FloatingCustomerServiceButton` 已添加到 `app/layout.tsx`：

```tsx
import { FloatingCustomerServiceButton } from '@/components/FloatingCustomerServiceButton';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <ChatwootWidget />
        <FloatingCustomerServiceButton />
      </body>
    </html>
  );
}
```

### 4. 点击按钮无反应

**调试步骤：**

#### 检查 Chatwoot 状态
在浏览器控制台运行：
```javascript
console.log('Chatwoot SDK:', !!window.chatwootSDK);
console.log('Chatwoot API:', !!window.$chatwoot);
```

#### 手动测试
在浏览器控制台运行：
```javascript
if (window.$chatwoot) {
  window.$chatwoot.toggle('open');
} else {
  console.log('Chatwoot not loaded');
}
```

### 5. 环境变量问题

**检查环境变量是否正确加载：**

访问 `/test-chatwoot` 页面，查看环境变量检查结果。

**常见问题：**
- `.env.local` 文件位置错误（应在项目根目录）
- 环境变量名称错误（必须以 `NEXT_PUBLIC_` 开头）
- 开发服务器未重启

### 6. 网络连接问题

**测试网络连接：**

#### 方法 1: 直接访问
在浏览器中访问：
```
https://app.chatwoot.com/packs/js/sdk.js
```

#### 方法 2: 使用 curl 测试
```bash
curl -I https://app.chatwoot.com/packs/js/sdk.js
```

#### 方法 3: 检查防火墙
确保防火墙或代理没有阻止对 Chatwoot 的访问。

### 7. 自托管 Chatwoot 问题

如果使用自托管的 Chatwoot 实例：

#### 检查 URL 格式
```env
# 正确格式（不要以斜杠结尾）
NEXT_PUBLIC_CHATWOOT_BASE_URL=https://your-chatwoot-domain.com

# 错误格式
NEXT_PUBLIC_CHATWOOT_BASE_URL=https://your-chatwoot-domain.com/
```

#### 检查 HTTPS
确保自托管实例使用 HTTPS，因为现代浏览器要求安全连接。

#### 检查 CORS 设置
确保 Chatwoot 实例允许来自你的域名的跨域请求。

## 调试工具

### 1. 使用调试页面
访问 `/test-chatwoot` 页面进行完整的集成测试。

### 2. 浏览器开发者工具
- **Console**: 查看 JavaScript 错误和日志
- **Network**: 检查脚本加载状态
- **Application**: 查看本地存储和会话数据

### 3. Chatwoot 管理后台
- 检查收件箱状态
- 查看聊天记录
- 验证 Website Token

## 常用命令

### 重启开发服务器
```bash
# 停止当前服务器 (Ctrl+C)
# 然后重新启动
pnpm dev
```

### 清除缓存
```bash
# 清除 Next.js 缓存
rm -rf .next
pnpm dev
```

### 检查依赖
```bash
pnpm install
```

## 联系支持

如果以上方法都无法解决问题：

1. 检查 [Chatwoot 官方文档](https://www.chatwoot.com/docs)
2. 查看 [Chatwoot GitHub Issues](https://github.com/chatwoot/chatwoot/issues)
3. 在项目中创建 Issue 并提供：
   - 错误信息截图
   - 浏览器控制台日志
   - 环境变量配置（隐藏敏感信息）
   - 操作系统和浏览器版本

## 预防措施

1. **定期检查**：定期访问测试页面确认功能正常
2. **监控日志**：关注浏览器控制台的错误信息
3. **备份配置**：保存有效的环境变量配置
4. **文档更新**：当 Chatwoot 更新时，检查是否需要更新集成代码 