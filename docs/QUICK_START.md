# Chatwoot 快速开始指南

## 🚀 5分钟快速集成

### 步骤 1: 创建环境变量文件

在项目根目录创建 `.env.local` 文件：

```bash
# 在项目根目录运行
touch .env.local
```

### 步骤 2: 添加环境变量

将以下内容添加到 `.env.local` 文件：

```env
NEXT_PUBLIC_CHATWOOT_WEBSITE_TOKEN=your_token_here
NEXT_PUBLIC_CHATWOOT_BASE_URL=https://app.chatwoot.com
```

### 步骤 3: 获取 Website Token

1. 访问 [Chatwoot](https://app.chatwoot.com) 并登录
2. 进入 **Settings** → **Inboxes**
3. 点击 **Add Inbox** 创建新的收件箱
4. 选择 **Website** 类型
5. 填写网站信息：
   - Website Name: 您的网站名称
   - Website URL: 您的网站地址（如：http://localhost:3000）
   - Welcome Heading: 欢迎标题
   - Welcome Tagline: 欢迎副标题
6. 完成创建后，复制 **Website Token**
7. 将 Token 粘贴到 `.env.local` 文件中

### 步骤 4: 重启开发服务器

```bash
# 停止当前服务器 (Ctrl+C)
# 然后重新启动
pnpm dev
```

### 步骤 5: 测试集成

1. 访问 `/test-chatwoot` 页面
2. 检查环境变量是否正确设置
3. 查看调试信息确认 Chatwoot 加载状态
4. 点击右下角的浮动按钮测试聊天功能

## 🔧 故障排除

### 问题: 浮动按钮不显示

**解决方案:**
1. 检查环境变量是否正确设置
2. 查看浏览器控制台是否有错误
3. 确认网络能访问 Chatwoot 服务器

### 问题: 点击按钮无反应

**可能原因:**
1. **Website Token 无效** - 检查 Token 是否正确复制
2. **网络问题** - 确认能访问 https://app.chatwoot.com
3. **脚本加载失败** - 检查浏览器控制台的 Network 标签

**调试步骤:**
1. 打开浏览器开发者工具 (F12)
2. 在 Console 标签页运行：
   ```javascript
   console.log('Chatwoot loaded:', !!window.$chatwoot);
   console.log('SDK loaded:', !!window.chatwootSDK);
   ```
3. 如果都是 `false`，说明脚本加载失败

### 问题: 聊天窗口样式问题

**说明:** Chatwoot 使用自己的样式系统，不受项目 CSS 影响。

**自定义方案:**
1. 登录 Chatwoot 管理后台
2. 进入 **Settings** → **Account Settings** → **Appearance**
3. 设置品牌颜色、字体等

## 📋 快速检查清单

- [ ] 创建了 `.env.local` 文件
- [ ] 设置了 `NEXT_PUBLIC_CHATWOOT_WEBSITE_TOKEN`
- [ ] 设置了 `NEXT_PUBLIC_CHATWOOT_BASE_URL`
- [ ] 重启了开发服务器
- [ ] 在 Chatwoot 后台创建了 Website 类型的收件箱
- [ ] 复制了正确的 Website Token
- [ ] 浮动按钮在右下角显示
- [ ] 点击按钮能打开聊天窗口

## 🎯 测试页面

访问 `/test-chatwoot` 页面进行完整的集成测试。

## 📞 需要帮助？

如果遇到问题：

1. 查看完整文档：`docs/CHATWOOT_SETUP.md`
2. 检查浏览器控制台错误信息
3. 确认 Chatwoot 账户和收件箱设置正确
4. 验证网络连接正常

---

🎉 **恭喜！** 现在您的网站已经集成了专业的客服系统！ 