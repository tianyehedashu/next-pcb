# 订单管理指南

## 概述

本文档说明了PCB订单系统中管理员和用户对订单的修改权限和功能。

## 用户权限

### 1. 用户可修改的内容

用户在订单状态为 `created`、`reviewed`、`unpaid` 时可以修改以下信息：

- **收货地址** (`shipping_address`)
  - 联系人姓名
  - 联系电话
  - 国家/省份/城市
  - 详细地址
  - 邮编
  - 快递方式

- **用户备注** (`user_notes`)
  - 添加或修改订单备注信息

- **报关信息**
  - 报关价值 (`customs_value`)
  - 报关描述 (`customs_description`)

- **联系方式**
  - 联系电话 (`contact_phone`)
  - 联系邮箱 (`contact_email`)

### 2. 用户操作限制

- 只能修改自己的订单
- 订单进入生产阶段后不能修改
- 只能取消特定状态的订单：`created`、`reviewed`、`unpaid`、`payment_pending`
- 只能删除草稿状态的订单

### 3. 用户端API路由

```
GET    /api/user/orders/[id]    # 获取订单详情
PATCH  /api/user/orders/[id]    # 修改订单信息
DELETE /api/user/orders/[id]    # 删除草稿订单
```

## 管理员权限

### 1. 管理员可修改的内容

管理员可以创建和修改管理员订单（admin_orders），包含以下信息：

- **订单状态** (`status`)
- **价格信息**
  - PCB价格 (`pcb_price`)
  - 管理员价格 (`admin_price`)
  - 人民币价格 (`cny_price`)
  - 汇率 (`exchange_rate`)
  - 运费 (`ship_price`)
  - 关税 (`custom_duty`)
  - 优惠券 (`coupon`)
  - 附加费 (`surcharges`)

- **时间信息**
  - 到期日期 (`due_date`)
  - 支付时间 (`pay_time`)
  - 生产天数 (`production_days`)
  - 交付日期 (`delivery_date`)

- **其他信息**
  - 支付状态 (`payment_status`)
  - 管理员备注 (`admin_note`)
  - 货币类型 (`currency`)

### 2. 管理员特殊功能

- **价格计算功能**
  - 计算PCB价格
  - 计算交期
  - 计算运费
  - 重新计算所有价格

- **邮件通知**
  - 创建/更新订单时可选择发送邮件通知用户

- **状态同步**
  - 修改管理员订单状态会自动同步到用户订单

### 3. 管理员端API路由

```
GET    /api/admin/orders              # 获取订单列表
GET    /api/admin/orders?id=[id]      # 获取订单详情
POST   /api/admin/orders/[id]/admin-order   # 创建管理员订单
PATCH  /api/admin/orders/[id]/admin-order   # 更新管理员订单
```

## 权限验证

### 1. 用户端验证

```typescript
// 验证用户身份
const { data: { user }, error } = await supabase.auth.getUser();
if (!user) return unauthorized;

// 验证订单所有权
const order = await getOrder(orderId);
if (order.user_id !== user.id) return forbidden;
```

### 2. 管理员端验证

```typescript
// 验证管理员角色
const profile = await getProfile(user.id);
const isAdmin = profile.role === 'admin' || profile.role === 'super_admin';
if (!isAdmin) return forbidden;
```

## 状态流转规则

### 1. 用户可取消的状态
- `created` - 已创建
- `reviewed` - 已审核
- `unpaid` - 未支付
- `payment_pending` - 支付中

### 2. 用户可修改信息的状态
- `created` - 已创建
- `reviewed` - 已审核  
- `unpaid` - 未支付

### 3. 状态变更记录

系统会自动记录所有状态变更历史，包含：
- 原状态和新状态
- 变更人员和角色
- 变更时间
- 变更原因（可选）

## 数据库表结构

### 1. 订单状态历史表

```sql
CREATE TABLE order_status_history (
  id UUID PRIMARY KEY,
  order_id UUID REFERENCES orders(id),
  from_status VARCHAR(50),
  to_status VARCHAR(50),
  changed_by UUID,
  changed_by_role VARCHAR(20),
  changed_by_name VARCHAR(255),
  reason TEXT,
  created_at TIMESTAMP
);
```

### 2. 用户操作日志表

```sql
CREATE TABLE user_order_logs (
  id UUID PRIMARY KEY,
  order_id UUID REFERENCES orders(id),
  user_id UUID,
  action VARCHAR(50),
  changes JSONB,
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMP
);
```

## UI组件

### 1. 用户端组件

- `OrderDetailClient` - 订单详情页面
- `OrderAddressCard` - 地址信息卡片（可编辑）
- `OrderPcbSpecCard` - PCB规格卡片（含备注编辑）
- `OrderSummaryCard` - 订单摘要卡片

### 2. 管理员端组件

- `AdminOrderDetailPage` - 管理员订单详情页面
- `AdminOrderForm` - 管理员订单表单
- `AdminOrderActions` - 管理员操作按钮组
- `OrderOverviewTabs` - 订单信息标签页

### 3. 通用组件

- `OrderStatusHistory` - 订单状态历史组件
- `OrderStepBar` - 订单进度条

## 最佳实践

1. **权限检查**：所有API调用前都要验证用户权限
2. **状态验证**：修改前检查订单当前状态是否允许修改
3. **日志记录**：重要操作都要记录到日志表
4. **错误处理**：提供清晰的错误信息给用户
5. **邮件通知**：重要状态变更应通知用户
6. **数据验证**：使用Zod或类似工具验证输入数据
7. **事务处理**：涉及多表操作时使用数据库事务 