# 付款状态重复显示修复

## 问题描述
用户订单列表中，用户付款后状态项显示了两个"Paid"徽章，造成信息重复。

## 问题原因
在 `renderOrderStatus` 函数中存在逻辑重复：

1. **主状态设置**：当 `payment_status === 'paid'` 且 `displayStatus === 'pending'` 时，将主状态设为 `'paid'`
2. **额外徽章**：同时又添加了独立的 "Paid" 徽章，条件是 `payment_status === 'paid'` 且 `displayStatus !== 'refunded'`

这导致主状态显示 "Paid" 的同时，又显示了额外的 "Paid" 徽章。

## 解决方案
**文件**: `app/profile/orders/OrdersPageClient.tsx`

修改额外 "Paid" 徽章的显示条件，当主状态已经是 "paid" 时不再显示：

```tsx
// 修改前
{adminOrder?.payment_status === 'paid' && displayStatus !== 'refunded' && (
  <Badge>Paid</Badge>
)}

// 修改后  
{adminOrder?.payment_status === 'paid' && displayStatus !== 'refunded' && displayStatus !== 'paid' && (
  <Badge>Paid</Badge>
)}
```

## 修复效果

### 修复前
- 主状态：Paid（绿色徽章）
- 附加徽章：Paid（绿色徽章）
- 结果：显示两个 "Paid"

### 修复后
- 主状态：Paid（绿色徽章）
- 附加徽章：无（因为 displayStatus 已经是 'paid'）
- 结果：只显示一个 "Paid"

## 状态显示逻辑总结

现在的状态显示规则：
1. **主状态优先**：显示订单的主要状态（退款、已付款、待处理等）
2. **补充信息**：只在主状态未包含该信息时显示补充徽章
3. **避免重复**：确保相同信息不会重复显示

## 测试验证
- ✅ 已付款订单只显示一个 "Paid" 状态
- ✅ 已退款订单只显示 "Refunded" 状态  
- ✅ 待付款订单显示原状态 + "Paid" 徽章（如果适用）
- ✅ 退款进行中的订单正确显示退款徽章 