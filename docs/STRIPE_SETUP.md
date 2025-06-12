# Stripe 支付集成设置说明

## 1. 安装依赖

```bash
pnpm add stripe @stripe/stripe-js @stripe/react-stripe-js
```

## 2. 环境变量配置

复制 `env.example.stripe` 到你的 `.env.local` 文件中，并填入你的 Stripe 密钥：

```bash
# Stripe Configuration
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

### 获取 Stripe 密钥

1. 登录 [Stripe Dashboard](https://dashboard.stripe.com/)
2. 进入 **Developers > API keys**
3. 复制 **Publishable key** 和 **Secret key**

### 设置 Webhook

1. 在 Stripe Dashboard 中，进入 **Developers > Webhooks**
2. 点击 **Add endpoint**
3. 设置 Endpoint URL: `https://yourdomain.com/api/payment/webhook`
4. 选择以下事件：
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `payment_intent.canceled`
5. 复制 **Signing secret** 作为 `STRIPE_WEBHOOK_SECRET`

## 3. 数据库迁移

运行以下 SQL 脚本来添加支付相关字段：

```sql
-- 运行 lib/data/migrations/add_payment_fields_to_pcb_quotes.sql
```

## 4. 测试

### 测试卡号

Stripe 提供了测试卡号用于开发：

- **成功支付**: 4242 4242 4242 4242
- **需要验证**: 4000 0025 0000 3155
- **被拒绝**: 4000 0000 0000 0002

### 测试流程

1. 用户提交报价
2. 管理员在后台设置价格
3. 用户在订单详情页点击支付
4. 使用测试卡号完成支付
5. 检查支付状态更新

## 5. 生产环境

### 切换到生产密钥

1. 在 Stripe Dashboard 中切换到 **Live mode**
2. 获取生产环境的 API 密钥
3. 更新环境变量为生产密钥
4. 重新设置生产环境的 Webhook

### 安全检查

- [ ] 确保所有密钥都是生产环境的
- [ ] Webhook 端点使用 HTTPS
- [ ] 验证 webhook 签名
- [ ] 支付金额验证正确

## 6. 文件结构

```
lib/
  stripe.ts                           # Stripe 客户端配置
app/
  api/
    payment/
      create-intent/route.ts          # 创建支付意图
      webhook/route.ts                # 处理 webhook
  payment/
    [orderId]/page.tsx               # 支付页面
components/
  custom-ui/
    StripePaymentForm.tsx           # 支付表单组件
  ui/
    alert.tsx                       # Alert 组件
```

## 7. 主要组件说明

### StripePaymentForm
- 集成 Stripe Elements
- 处理支付表单提交
- 显示支付状态和错误信息

### 支付 API
- 验证用户权限和订单状态
- 创建 Stripe Payment Intent
- 处理 webhook 事件更新订单状态

## 8. 常见问题

### Q: 支付按钮不显示
A: 检查管理员是否已设置价格，订单状态是否正确

### Q: Webhook 不工作
A: 检查 webhook URL 是否正确，签名密钥是否匹配

### Q: 支付失败
A: 检查 Stripe 日志，确认卡号和金额是否正确

### Q: 支付成功但状态未更新
A: 检查 webhook 处理逻辑，确认数据库更新正确 