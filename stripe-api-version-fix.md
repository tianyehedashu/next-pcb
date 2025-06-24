# Stripe API 版本与 Webhook 修复指南

## 🔧 已修复的问题

### 1. API 版本统一
- **修改前**: Stripe 库使用 `2025-05-28.basil`，事件使用 `2025-04-30.basil`
- **修改后**: 统一使用稳定版本 `2024-06-20`

### 2. 官方推荐的 Next.js App Router Webhook 处理
- 使用 `request.text()` 获取原始请求体
- 直接使用 `stripe.webhooks.constructEvent()` 进行验证
- 简化了调试日志输出

## 📋 修复步骤总结

### 1. Stripe 库配置修复
```typescript
// lib/stripe.ts
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20', // 使用稳定的 API 版本
  appInfo: {
    name: 'SpeedxPCB',
    version: '1.0.0',
  },
  typescript: true,
});
```

### 2. Webhook 处理器优化
```typescript
// 使用官方推荐方式
const payload = await request.text();
const sig = request.headers.get('stripe-signature');
const event = stripe.webhooks.constructEvent(payload, sig, webhookSecret);
```

## 🚀 测试步骤

### 1. 重新生成 Webhook Secret
```powershell
# 停止现有的 stripe listen
# 重新启动
stripe listen --forward-to localhost:3000/api/payment/webhook

# 设置新的 webhook secret
$env:STRIPE_WEBHOOK_SECRET="whsec_新的secret"
```

### 2. 重启开发服务器
```powershell
# 重启 Next.js 开发服务器以应用新的 API 版本
pnpm run dev
```

### 3. 测试 Webhook
```powershell
stripe trigger payment_intent.succeeded
```

## 📊 API 版本说明

### 可选的 API 版本
- `2024-06-20` - 推荐的稳定版本
- `2024-04-10` - 较早的稳定版本
- `2023-10-16` - 长期支持版本

### 修改 API 版本的位置
1. **Stripe 库配置** (已修改): `lib/stripe.ts`
2. **Stripe Dashboard**: Webhooks → 端点设置 → API 版本
3. **环境变量**: 如果使用 `STRIPE_API_VERSION`

## ⚠️ 注意事项

1. **API 版本一致性**: 确保所有 Stripe 配置使用相同的 API 版本
2. **Webhook Secret**: 每次重启 `stripe listen` 都会生成新的 secret
3. **开发服务器重启**: 修改 API 版本后必须重启开发服务器

## 🔍 故障排除

### 如果仍有签名验证问题
1. 确认 webhook secret 正确设置
2. 检查 API 版本是否一致
3. 验证请求体没有被中间件修改

### 查看详细日志
现在的 webhook 处理器会显示：
- Payload 类型和长度
- 签名头是否存在
- 事件类型和 ID
- 详细的错误信息

## 📞 联系支持

如果问题仍然存在，请提供：
- Webhook 调试日志
- 环境变量配置（不包含敏感信息）
- 具体的错误消息 