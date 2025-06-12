# 币种和价格处理设计

## 核心原则

管理员订单表 (`admin_orders`) 包含完整的定价信息，无需额外转换：

- `admin_price`: 管理员设定的最终价格
- `currency`: 价格对应的币种 (USD/CNY等)
- `exchange_rate`: 参考汇率信息

## 设计优势

### 1. 管理员完全控制
- 管理员可以设置任意币种的价格
- 价格显示直接使用管理员设定值
- 无需依赖实时汇率转换

### 2. 简化代码逻辑
- 不使用 `toUSD()` 等转换函数
- 直接读取和显示数据库中的价格
- 减少计算错误和依赖

### 3. 灵活性
- 支持多种币种显示
- 管理员可根据市场情况灵活定价
- 避免汇率波动对定价的影响

## 实现方式

### 价格显示
```tsx
// 使用辅助函数格式化价格
{formatOrderPrice(order)}

// 手动处理
{adminOrder?.currency === 'CNY' ? '¥' : '$'}{adminOrder.admin_price.toFixed(2)}
```

### 币种符号
```tsx
// 获取币种符号
{getOrderCurrencySymbol(order)}
```

### 支付金额
```tsx
// 获取支付金额（无转换）
const amount = getOrderPaymentAmount(order);
```

## 数据流

```
管理员设定价格 → 存储到 admin_orders 表 → 直接显示给用户 → 用于支付
```

## 注意事项

1. **Stripe 支付**: 虽然显示币种可能是 CNY，但 Stripe 支付仍使用 USD
2. **价格一致性**: 确保显示价格和支付价格保持一致
3. **管理员培训**: 管理员需要了解设定的价格将直接显示给用户
4. **汇率信息**: `exchange_rate` 字段用于记录参考汇率，但不用于自动转换 