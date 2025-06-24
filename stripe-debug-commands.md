# Stripe Payment Webhook Debug Commands

## 基本设置

### 1. 安装和登录
```powershell
# 安装 Stripe CLI
scoop install stripe

# 登录到 Stripe
stripe login
```

### 2. 启动 Webhook 转发 (必须先运行)
```powershell
# 将 Stripe webhook 转发到本地开发服务器
stripe listen --forward-to localhost:3000/api/payment/webhook
```

**重要**: 运行此命令后，复制输出的 webhook secret 并设置环境变量：
```powershell
$env:STRIPE_WEBHOOK_SECRET="whsec_HnSrVkvniRMtNrawHlHIUJEXwFbJwq6A"
```

**📢 Signature Verification Fix Applied:**
- Webhook handler now uses raw request body to preserve exact bytes
- Added comprehensive debugging logs
- Fixed Next.js body parsing issues

**If you're still getting signature errors, run:**
```powershell
.\fix-webhook-signature.ps1
```

## 测试支付流程

### 3. 创建测试 Payment Intent
```powershell
# 创建一个 $20.00 的测试支付
stripe payment_intents create `
  --amount=2000 `
  --currency=usd `
  --automatic-payment-methods[enabled]=true `
  --metadata[quote_id]="test-quote-123"
```

### 4. 触发 Webhook 事件

#### 成功支付
```powershell
stripe trigger payment_intent.succeeded
```

#### 支付失败
```powershell
stripe trigger payment_intent.payment_failed
```

#### 支付取消
```powershell
stripe trigger payment_intent.canceled
```

## 调试和监控

### 5. 查看事件历史
```powershell
# 查看最近的事件
stripe events list --limit=10

# 查看特定事件详情
stripe events retrieve evt_xxxxxxxxxxxxx --expand data.object
```

### 6. 查看 Webhook 端点
```powershell
# 列出所有 webhook 端点
stripe webhooks list

# 查看特定 webhook 详情
stripe webhooks retrieve we_xxxxxxxxxxxxx
```

### 7. 手动重发 Webhook
```powershell
# 重发特定事件到 webhook
stripe events resend evt_xxxxxxxxxxxxx
```

## 高级调试

### 8. 创建特定场景的 Payment Intent
```powershell
# 创建一个会失败的支付 (使用测试卡号)
stripe payment_intents create `
  --amount=2000 `
  --currency=usd `
  --payment-method-data[type]=card `
  --payment-method-data[card][number]=4000000000000002 `
  --payment-method-data[card][exp_month]=12 `
  --payment-method-data[card][exp_year]=2025 `
  --payment-method-data[card][cvc]=123 `
  --confirm=true `
  --metadata[quote_id]="test-fail-quote-456"
```

### 9. 监控实时事件
```powershell
# 实时监控所有 Stripe 事件
stripe listen --print-json
```

### 10. 测试 Webhook 签名验证
```powershell
# 发送没有正确签名的请求来测试验证
curl -X POST http://localhost:3000/api/payment/webhook `
  -H "Content-Type: application/json" `
  -d '{"test": "invalid_signature"}'
```

## 常见测试卡号

- **成功**: 4242424242424242
- **需要验证**: 4000002500003155
- **拒绝**: 4000000000000002
- **余额不足**: 4000000000009995
- **过期卡**: 4000000000000069

## 环境变量检查

确保以下环境变量已设置：
```powershell
echo $env:STRIPE_PUBLISHABLE_KEY
echo $env:STRIPE_SECRET_KEY
echo $env:STRIPE_WEBHOOK_SECRET
```

## 调试检查清单

- [ ] Stripe CLI 已安装并登录
- [ ] Webhook 转发已启动 (`stripe listen`)
- [ ] 本地开发服务器在 3000 端口运行
- [ ] STRIPE_WEBHOOK_SECRET 已设置
- [ ] Supabase 连接正常
- [ ] 数据库中有对应的 pcb_quotes 和 admin_orders 记录

## 故障排除

### Webhook 签名验证失败
- 确保 STRIPE_WEBHOOK_SECRET 正确设置
- 检查 webhook 端点 URL 是否正确

### 找不到订单记录
- 确保 payment_intent_id 在数据库中存在
- 检查 pcb_quotes 表的数据结构

### RPC 函数调用失败
- 检查 `handle_payment_success` 函数是否存在
- 验证函数参数和返回值格式 