# 退款字段简化 - 复用现有status字段

## 问题背景
在添加退款功能时，我们添加了一个新的 `order_status` 字段来进行退款策略判断，但发现 `admin_orders` 表中已经有一个 `status` 字段用于管理员工作流程。这导致了字段重复和混乱。

## 解决方案
复用现有的 `status` 字段进行退款策略判断，删除新添加的 `order_status` 字段。

## 修改内容

### 1. 数据库脚本更新
**文件**: `scripts/add_refund_fields_to_admin_orders.sql`

**修改**:
- 移除 `order_status` 字段的创建逻辑
- 添加对现有 `status` 字段的检查和说明
- 更新索引创建，使用 `status` 而不是 `order_status`
- 更新字段注释

### 2. API代码更新
**文件**: `app/api/user/orders/[id]/request-refund/route.ts`

**修改**:
- 查询语句中使用 `status` 替代 `order_status`
- 退款策略判断使用 `adminOrder.status`

### 3. 前端类型定义更新
**文件**: `app/profile/orders/[id]/page.tsx`

**修改**:
- `AdminOrder` 接口中移除重复的 `status` 字段
- 保持只有一个 `status?: string | null` 字段

### 4. 邮件通知更新
**文件**: `lib/email/admin-notifications.ts`

**修改**:
- 参数名更新为 `adminOrderStatus` 以更清晰地表示这是管理员订单状态

## 现有status字段的值含义

根据 `app/api/admin/orders/[id]/status/route.ts` 中的定义，`status` 字段支持以下值：

### 管理员工作流状态
- `draft`: 草稿
- `created`: 已创建
- `reviewed`: 已审核
- `unpaid`: 未支付
- `payment_pending`: 支付中
- `paid`: 已支付
- `in_production`: 生产中
- `quality_check`: 质量检查
- `ready_for_shipment`: 准备发货
- `shipped`: 已发货
- `delivered`: 已送达
- `completed`: 已完成
- `cancelled`: 已取消
- `on_hold`: 暂停
- `rejected`: 已拒绝
- `refunded`: 已退款

### 退款策略映射
根据 `status` 字段值确定退款百分比：

```typescript
const REFUND_POLICY: Record<string, number> = {
  paid: 0.95,           // 95% 退款
  in_production: 0.5,   // 50% 退款
  shipped: 0,           // 0% 退款
  completed: 0,         // 0% 退款
};
```

## 优势

1. **减少字段冗余**: 避免了 `status` 和 `order_status` 的重复
2. **保持一致性**: 使用统一的状态管理系统
3. **简化维护**: 只需要维护一个状态字段
4. **清晰的语义**: `status` 字段既用于工作流管理，也用于退款策略

## 影响范围

### 已修改的文件
- `scripts/add_refund_fields_to_admin_orders.sql`
- `app/api/user/orders/[id]/request-refund/route.ts`
- `app/profile/orders/[id]/page.tsx`
- `lib/email/admin-notifications.ts`

### 需要注意的地方
- 确保数据库中的 `status` 字段值与退款策略一致
- 在管理员后台中更新订单状态时，要考虑对退款策略的影响
- 新的订单状态添加时，需要同时考虑是否需要更新退款策略

## 数据库迁移
运行更新后的脚本：
```bash
psql -d your_database -f scripts/add_refund_fields_to_admin_orders.sql
```

脚本会自动检查并跳过不需要的字段创建，确保向后兼容。

## 总结
通过复用现有的 `status` 字段，我们成功简化了数据库结构，减少了字段冗余，提高了系统的一致性和可维护性。退款功能现在完全基于统一的订单状态管理系统工作。 