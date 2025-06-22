# 币种验证系统文档

## 概述

为确保订单流程的规范性，系统在多个关键节点实施币种检查，要求所有进入支付流程的订单币种必须设置为美元(USD)。

## 验证检查点

### 1. 管理员订单保存检查 🔒

**位置：** 
- `app/admin/orders/[id]/page.tsx` - handleSave函数
- `app/admin/components/AdminOrderForm.tsx` - 保存按钮点击事件

**检查逻辑：**
```typescript
if (cleanedValues.status === 'reviewed' && cleanedValues.currency !== 'USD') {
  toast.error('⚠️ 币种检查失败', {
    description: `订单提交前必须设置为美元(USD)，当前币种: ${cleanedValues.currency}`,
    duration: 5000
  });
  return; // 阻止保存
}
```

**触发时机：** 管理员将订单状态设置为"已审核"(reviewed)时
**验证结果：** 如果币种不是USD，则阻止保存并显示错误提示

### 2. 支付前币种检查 💳

**位置：** `app/api/payment/create-intent/route.ts`

**检查逻辑：**
```typescript
if (adminOrder.currency !== 'USD') {
  return NextResponse.json(
    { error: `Payment not allowed. Order currency must be USD, current currency: ${adminOrder.currency}` },
    { status: 400 }
  );
}
```

**触发时机：** 用户尝试创建支付意图时
**验证结果：** 如果币种不是USD，则返回400错误，阻止支付创建

### 3. 状态变更币种提醒 ⚠️

**位置：** `app/admin/orders/[id]/components/PriceManagementPanel.tsx`

**检查逻辑：**
```typescript
if (newStatus === 'reviewed' && currentCurrency !== 'USD') {
  toast.warning('⚠️ 币种提醒', {
    description: `当前币种为${getCurrencyName(currentCurrency)}，提交前请确保设置为美元(USD)`,
    duration: 4000
  });
}
```

**触发时机：** 管理员在价格管理面板中修改订单状态时
**验证结果：** 如果设置为"已审核"且币种不是USD，显示提醒

## 验证流程图

```
订单创建 → 管理员设置价格 → 状态变更提醒 → 保存前检查 → 支付前检查 → 支付成功
    ↓              ↓              ↓            ↓            ↓
  任意币种      任意币种        ⚠️提醒        🔒阻止      🔒阻止
                                           (非USD)     (非USD)
```

## 技术实现细节

### 错误处理
- **管理员端：** 使用toast显示错误信息，阻止操作继续
- **API端：** 返回400状态码和错误消息
- **用户端：** 显示支付失败提示

### 用户体验优化
- 📱 实时提醒：状态变更时立即提示
- 🎯 明确信息：错误提示包含当前币种和要求币种
- ⏱️ 合理时长：提示显示3-5秒，确保用户看到

### 支持的币种
系统支持以下币种设置：
- **USD** - 美元 ($) - 唯一允许支付的币种
- **CNY** - 人民币 (¥) - 仅用于内部计算和显示
- **EUR** - 欧元 (€) - 仅用于报价阶段

## 测试验证

### 测试页面
访问 `/test-currency-validation` 可以测试完整的币种验证逻辑：

1. **配置测试场景**：选择币种和订单状态
2. **运行验证测试**：检查所有验证点
3. **模拟操作**：测试保存和支付操作
4. **查看结果**：实时显示验证结果

### 测试场景

#### ✅ 正常流程
- 币种：USD
- 状态：reviewed
- 结果：所有检查通过，允许保存和支付

#### ❌ 异常流程1
- 币种：CNY
- 状态：reviewed
- 结果：保存被阻止，支付被拒绝

#### ⚠️ 异常流程2
- 币种：EUR
- 状态：reviewed
- 结果：显示提醒，但需要手动修改币种

## 配置和维护

### 修改允许的支付币种
如需修改允许支付的币种，需要同时更新以下位置：
1. `app/admin/orders/[id]/page.tsx` (handleSave函数)
2. `app/admin/components/AdminOrderForm.tsx` (保存按钮)
3. `app/api/payment/create-intent/route.ts` (支付API)
4. `app/admin/orders/[id]/components/PriceManagementPanel.tsx` (状态提醒)

### 币种验证配置
```typescript
const ALLOWED_PAYMENT_CURRENCY = 'USD'; // 修改此处可变更允许的支付币种
```

## 最佳实践

1. **管理员操作**：
   - 设置订单价格时，建议直接使用USD币种
   - 审核订单前，确认币种设置正确
   - 关注状态变更时的币种提醒

2. **开发维护**：
   - 新增验证点时，保持错误提示的一致性
   - 测试时使用 `/test-currency-validation` 验证功能
   - 更新允许币种时，同步修改所有验证点

3. **错误排查**：
   - 支付失败时，首先检查订单币种
   - 查看浏览器控制台的详细错误信息
   - 使用测试页面排查验证逻辑问题

## 更新日志

### v1.0.0 (2024)
- ✅ 实现管理员订单保存前币种检查
- ✅ 实现支付API币种验证
- ✅ 实现状态变更币种提醒
- ✅ 创建币种验证测试页面
- ✅ 完善错误提示和用户体验 