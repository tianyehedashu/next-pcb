# 支付状态与到期日管理功能

## 功能概述

在管理员订单详情页面中新增了支付状态显示、支付时间记录和到期日设置功能，提供更完整的订单生命周期管理。

## 核心功能

### 1. 支付状态管理

#### 支持的支付状态
- 💰 **未支付 (unpaid)**: 默认状态，等待用户支付
- 🔄 **支付中 (pending)**: 支付流程进行中
- ✅ **已支付 (paid)**: 支付成功完成
- 💸 **部分支付 (partially_paid)**: 订单部分金额已支付
- ❌ **支付失败 (failed)**: 支付尝试失败
- 🚫 **已取消 (cancelled)**: 支付被取消
- 💵 **已退款 (refunded)**: 已处理退款

#### 状态切换逻辑
```typescript
// 自动设置支付时间
if (payment_status === 'paid' && !pay_time) {
  pay_time = new Date().toISOString();
}

// 清除支付时间（非已支付状态）
if (payment_status !== 'paid' && pay_time) {
  pay_time = null;
}
```

### 2. 支付时间记录

#### 字段说明
- **字段名**: `pay_time`
- **类型**: `TIMESTAMP WITH TIME ZONE`
- **用途**: 记录实际支付完成的时间
- **权限**: 管理员可手动设置，系统可自动记录

#### 显示逻辑
- 只有支付状态为"已支付"时才允许设置支付时间
- 支付时间显示绿色勾号图标表示已确认
- 支持手动调整（用于处理特殊情况）

### 3. 到期日管理

#### 字段说明
- **字段名**: `due_date`
- **类型**: `DATE`
- **用途**: 设置订单的到期日期
- **功能**: 用于跟踪订单时效性

#### 过期检测
- 自动检测当前日期是否超过到期日
- 过期订单显示警告标识
- 在状态面板中提供过期提醒

## 界面实现

### 1. 价格管理面板 (PriceManagementPanel)

```typescript
interface AdminOrderEdit {
  // 新增字段
  payment_status?: string;
  pay_time?: string;
  due_date?: string;
  // ... 其他字段
}
```

#### 界面布局
```jsx
{/* 订单状态和支付管理 */}
<div className="border-t pt-3">
  <Label className="text-sm font-medium text-gray-700 mb-3 block flex items-center gap-2">
    <CreditCard className="w-4 h-4" />
    订单状态与支付管理
  </Label>
  
  {/* 状态选择器 */}
  <div className="grid grid-cols-2 gap-2 text-xs mb-3">
    <select value={payment_status}>
      <option value="unpaid">💰 未支付</option>
      <option value="paid">✅ 已支付</option>
      {/* ... 其他选项 */}
    </select>
  </div>
  
  {/* 时间设置 */}
  <div className="grid grid-cols-2 gap-2 text-xs mb-3">
    <Input type="date" /> {/* 到期日 */}
    <Input type="datetime-local" /> {/* 支付时间 */}
  </div>
  
  {/* 状态提示 */}
  <div className="status-indicator">
    {/* 根据状态显示不同颜色和图标 */}
  </div>
</div>
```

### 2. 管理员表单 (AdminOrderForm)

```typescript
const adminOrderSchema = {
  payment_status: {
    type: "string",
    title: "支付状态",
    "x-component": "Select",
    "x-component-props": {
      options: [
        { label: "💰 未支付", value: "unpaid" },
        { label: "✅ 已支付", value: "paid" },
        // ... 其他选项
      ]
    }
  },
  due_date: {
    type: "string",
    title: "到期日",
    "x-component": "Input",
    "x-component-props": { type: "date" }
  },
  pay_time: {
    type: "string", 
    title: "支付时间 🔒",
    "x-component": "Input",
    "x-component-props": { 
      type: "datetime-local",
      readonly: true,
      placeholder: "系统自动记录"
    }
  }
};
```

#### 表单分组
```typescript
const formGroups: FormGroup[] = [
  {
    title: "订单状态",
    fields: ["status", "payment_status", "due_date", "pay_time"],
    layout: "grid"
  },
  // ... 其他分组
];
```

## 数据库结构

### admin_orders 表字段

```sql
-- 支付状态
ALTER TABLE public.admin_orders 
ADD COLUMN IF NOT EXISTS payment_status VARCHAR(50) DEFAULT 'unpaid';

-- 支付时间
ALTER TABLE public.admin_orders 
ADD COLUMN IF NOT EXISTS pay_time TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- 到期日
ALTER TABLE public.admin_orders 
ADD COLUMN IF NOT EXISTS due_date DATE DEFAULT NULL;

-- 添加索引
CREATE INDEX IF NOT EXISTS idx_admin_orders_payment_status ON admin_orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_admin_orders_due_date ON admin_orders(due_date);

-- 添加注释
COMMENT ON COLUMN admin_orders.payment_status IS 'Payment status: unpaid, pending, paid, failed, cancelled, refunded';
COMMENT ON COLUMN admin_orders.pay_time IS 'Timestamp when payment was completed';
COMMENT ON COLUMN admin_orders.due_date IS 'Order due date';
```

## 业务逻辑

### 1. 支付状态验证

```typescript
const validatePaymentStatus = (orderData: AdminOrderEdit) => {
  const results = [];
  
  // 支付状态和时间的一致性
  if (orderData.payment_status === 'paid' && !orderData.pay_time) {
    results.push({
      field: 'pay_time',
      status: 'error',
      message: '支付状态为已支付时必须设置支付时间'
    });
  }
  
  // 订单状态和支付状态的匹配
  if (orderData.status === 'paid' && orderData.payment_status !== 'paid') {
    results.push({
      field: 'status_consistency',
      status: 'error', 
      message: '订单状态与支付状态不匹配'
    });
  }
  
  return results;
};
```

### 2. 到期日检测

```typescript
const checkDueDate = (dueDate: string) => {
  if (!dueDate) return null;
  
  const due = new Date(dueDate);
  const now = new Date();
  const isOverdue = due < now;
  
  return {
    isOverdue,
    message: isOverdue ? '订单已过期' : '到期日正常',
    daysRemaining: Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  };
};
```

### 3. 自动化处理

```typescript
const handlePaymentStatusChange = (newStatus: string, currentData: AdminOrderEdit) => {
  const updates: Partial<AdminOrderEdit> = {};
  
  // 设置为已支付时自动记录支付时间
  if (newStatus === 'paid' && !currentData.pay_time) {
    updates.pay_time = new Date().toISOString();
    toast.success('✅ 自动设置支付时间为当前时间');
  }
  
  // 非已支付状态时清除支付时间
  if (newStatus !== 'paid' && currentData.pay_time) {
    updates.pay_time = '';
    toast.info('🔄 已清除支付时间');
  }
  
  return updates;
};
```

## 用户界面特性

### 1. 状态指示器

```jsx
const PaymentStatusIndicator = ({ status, payTime }) => {
  const statusConfig = {
    'paid': { icon: '✅', color: 'text-green-600 bg-green-100', label: '支付已完成' },
    'failed': { icon: '❌', color: 'text-red-600 bg-red-100', label: '支付失败' },
    'pending': { icon: '🔄', color: 'text-blue-600 bg-blue-100', label: '支付处理中' },
    // ... 其他状态
  };
  
  const config = statusConfig[status] || statusConfig.unpaid;
  
  return (
    <div className={`p-2 rounded text-xs ${config.color}`}>
      <div className="font-medium">{config.icon} {config.label}</div>
      {payTime && (
        <div className="text-xs opacity-75">
          支付时间: {new Date(payTime).toLocaleString('zh-CN')}
        </div>
      )}
    </div>
  );
};
```

### 2. 智能表单控制

```jsx
const PaymentTimeInput = ({ paymentStatus, value, onChange }) => {
  return (
    <div>
      <Label className="flex items-center gap-2">
        支付时间
        {paymentStatus === 'paid' && (
          <CheckCircle className="w-4 h-4 text-green-500" />
        )}
      </Label>
      <Input
        type="datetime-local"
        value={value}
        onChange={onChange}
        disabled={paymentStatus !== 'paid'}
        className="mt-1"
      />
    </div>
  );
};
```

## 测试功能

### 测试页面
访问 `/test-payment-management` 可以测试以下功能：

1. **支付状态切换**: 测试不同支付状态之间的切换逻辑
2. **支付时间自动设置**: 验证支付状态变为"已支付"时自动设置时间
3. **到期日检测**: 测试过期订单的检测和警告
4. **数据验证**: 验证状态一致性和数据完整性
5. **界面响应**: 测试状态变化时的界面更新

### 验证规则
- 支付状态为"已支付"时必须有支付时间
- 非"已支付"状态不应有支付时间
- 订单状态和支付状态应保持一致
- 到期日应晚于创建日期

## 最佳实践

### 1. 状态管理
- 优先使用系统自动设置的支付时间
- 手动调整时间时需要提供理由
- 定期检查过期订单并处理

### 2. 数据一致性
- 支付状态变更时同步更新相关字段
- 保持订单状态和支付状态的逻辑一致性
- 记录状态变更的操作日志

### 3. 用户体验
- 提供清晰的状态指示和说明
- 自动化常见操作（如设置支付时间）
- 对异常状态提供明确的提示信息

## 安全考虑

### 1. 权限控制
- 只有管理员可以修改支付状态
- 支付时间的自动设置需要验证权限
- 敏感操作需要审计日志

### 2. 数据验证
- 服务端验证所有状态变更
- 防止客户端篡改支付状态
- 支付时间不能设置为未来时间

### 3. 审计追踪
- 记录所有状态变更操作
- 保留操作人员和时间信息
- 支持状态变更历史查询

## 版本历史

- **v1.0.0** (2024-01-20): 初始版本
  - 添加支付状态管理
  - 实现支付时间记录
  - 增加到期日设置功能
  - 创建测试页面和文档 