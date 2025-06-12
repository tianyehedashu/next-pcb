# PCB 支付流程文档

## 概述

PCB 报价系统的支付功能基于 Stripe 集成，采用管理员审核制度，确保所有支付都经过管理员审核和定价。

## 数据库架构

### 主要表结构

1. **pcb_quotes** (用户报价表)
   - 存储用户提交的报价请求
   - 包含基础订单信息和用户数据

2. **admin_orders** (管理员订单表)
   - 存储管理员审核后的订单信息
   - **重要**: 包含最终的价格、币种和汇率信息
   - 一对一关系：每个用户订单对应唯一的管理员订单

### 价格和币种管理

管理员订单表包含完整的定价信息：
- `admin_price`: 管理员设定的最终价格
- `currency`: 价格币种 (USD/CNY)
- `exchange_rate`: 汇率信息
- `payment_status`: 支付状态
- `order_status`: 订单状态

**关键设计原则**: 
- 所有价格显示直接使用管理员设定的价格和币种
- 无需使用 `toUSD` 等转换函数
- 管理员完全控制最终展示给用户的价格

## 支付流程

### 1. 用户提交报价
```
用户填写 PCB 规格 → 提交到 pcb_quotes 表 → 状态: pending
```

### 2. 管理员审核定价
```
管理员查看报价 → 创建 admin_orders 记录 → 设置 admin_price 和 currency
```

### 3. 用户支付
```
用户查看订单 → 显示管理员定价 → 进入支付页面 → 完成 Stripe 支付
```

### 4. 支付确认
```
Stripe webhook → 更新 payment_status → 订单状态变更为 paid
```

## 权限控制

### 支付条件检查
使用 `canOrderBePaid()` 函数验证：
- 管理员订单存在
- 已设置 admin_price
- 支付状态不是 'paid'

### 价格展示
使用辅助函数：
- `formatOrderPrice()`: 格式化价格显示
- `getOrderCurrencySymbol()`: 获取币种符号
- `getOrderPaymentAmount()`: 获取支付金额

## API 端点

### POST /api/payment/create-intent
- 验证用户权限和订单状态
- 直接使用 `admin_price` 创建支付意图
- 金额单位自动转换为分 (cents)

### POST /api/payment/webhook
- 处理 Stripe 支付回调
- 更新 admin_orders 表的支付状态
- 记录支付完成时间

## 前端集成

### 订单详情页面
- 显示管理员定价（带正确币种符号）
- 只有已定价订单显示支付按钮
- 状态实时更新

### 支付页面
- Stripe Elements 集成
- 显示订单摘要和价格
- 支付状态处理和错误提示

### 组件使用
```tsx
// 价格显示
{formatOrderPrice(order)}

// 币种符号
{getOrderCurrencySymbol(order)}

// 支付金额
{getOrderPaymentAmount(order)}
```

## 安全特性

1. **用户权限验证**: 只能支付自己的订单
2. **订单状态检查**: 防止重复支付
3. **管理员审核**: 所有支付必须经过管理员定价
4. **Webhook 验证**: Stripe 签名验证确保回调安全
5. **一对一关系**: 数据库约束确保订单关系完整性

## 状态流转

```
pending → admin_review → priced → payment_pending → paid → completed
```

- `pending`: 用户提交，等待管理员审核
- `admin_review`: 管理员正在审核
- `priced`: 管理员已定价，可以支付
- `payment_pending`: 用户发起支付
- `paid`: 支付完成
- `completed`: 订单完成

## 错误处理

### 常见错误场景
1. 订单未找到或权限不足
2. 订单未经管理员审核
3. 订单未定价
4. 订单已支付
5. Stripe 支付失败

### 错误提示
所有错误都有对应的用户友好提示信息，并记录详细日志用于调试。

## 测试建议

1. **单元测试**: 测试辅助函数和状态检查
2. **集成测试**: 测试完整支付流程
3. **安全测试**: 验证权限控制和防止恶意操作
4. **边界测试**: 测试各种异常情况和边界条件

## 维护注意事项

1. 监控 Stripe webhook 状态
2. 定期检查支付状态一致性
3. 关注汇率变化对定价的影响
4. 保持支付金额和显示金额的一致性 