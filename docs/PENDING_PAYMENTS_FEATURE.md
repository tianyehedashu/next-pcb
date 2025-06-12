# 待支付订单功能

## 功能概述

新增了"Pending Payments"菜单项，允许用户快速查看所有可以支付的订单。

## 功能特点

### 1. 新增菜单项
- 在用户侧边栏的"My Business"部分添加了"Pending Payments"菜单
- 图标：信用卡图标 (CreditCard)
- 路径：`/profile/orders?type=pending-payment`

### 2. 智能过滤
- 只显示满足支付条件的订单：
  - 存在管理员订单记录
  - 管理员已设置价格 (`admin_price > 0`)
  - 支付状态不是 'paid'

### 3. 特殊显示
- **页面标题**：动态显示"Pending Payments"而不是"My Orders"
- **页面描述**：显示"Orders that are ready for payment"
- **状态标签**：可支付订单显示额外的"Ready to Pay"绿色标签
- **支付按钮**：在操作列显示绿色的"Pay"按钮，直接跳转到支付页面

### 4. 统计信息
- **订单数量**：显示"Pending Payments"而不是"Total Orders"
- **总金额**：计算所有待支付订单的总金额，显示"Total Amount Due"

## 技术实现

### 数据获取
```typescript
// 使用现有API获取完整的订单数据（包含admin_orders）
const response = await fetch(`/api/user/orders/${order.id}`);
```

### 过滤逻辑
```typescript
if (orderType === 'pending-payment') {
  const canPay = canOrderBePaid(order as OrderWithAdminOrder);
  return matchesStatus && matchesSearch && canPay;
}
```

### 支付条件检查
使用 `canOrderBePaid()` 函数：
- 检查管理员订单是否存在
- 检查是否已设置价格
- 检查支付状态

## 用户体验

### 导航流程
1. 用户点击侧边栏"Pending Payments"
2. 页面显示所有可支付的订单
3. 每个订单显示"Ready to Pay"标签和"Pay"按钮
4. 点击"Pay"按钮直接跳转到支付页面

### 视觉设计
- 绿色主题：表示可以进行支付操作
- 清晰的状态标识：双重标签显示（订单状态 + 支付状态）
- 直观的操作按钮：绿色"Pay"按钮突出显示

## 兼容性

- 与现有订单列表页面完全兼容
- 通过URL参数 `type=pending-payment` 控制显示模式
- 不影响原有的订单查看和管理功能

## 使用场景

1. **用户快速支付**：用户可以快速找到所有需要支付的订单
2. **管理员跟进**：管理员可以引导用户使用此功能完成支付
3. **订单管理**：用户可以集中处理所有待支付订单

## 后续优化建议

1. 添加批量支付功能
2. 支持支付提醒和通知
3. 添加支付期限显示
4. 支持不同币种的金额汇总 