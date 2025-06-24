# 订单列表状态显示增强

## 修改概述
完善了用户和管理员订单列表中的状态显示逻辑，增加了退款状态的显示，提供更全面的订单状态信息。

## 用户订单列表增强

### 修改文件
- `app/profile/orders/OrdersPageClient.tsx`

### 主要更新

#### 1. 接口扩展
```typescript
interface AdminOrderInfo {
  id: string;
  status: string;
  admin_price: number | null;
  currency: string;
  payment_status?: string | null;
  // 新增退款相关字段
  refund_status?: string | null;
  requested_refund_amount?: number | null;
  approved_refund_amount?: number | null;
  [key: string]: unknown;
}
```

#### 2. 数据获取优化
```sql
-- 更新查询以包含退款信息
admin_orders (
  id,
  status,
  admin_price,
  currency,
  payment_status,
  refund_status,              -- 新增
  requested_refund_amount,    -- 新增
  approved_refund_amount      -- 新增
)
```

#### 3. 状态显示增强
```typescript
const renderOrderStatus = (order: OrderListItem) => {
  // 现在同时显示订单状态和退款状态
  return (
    <div className="flex flex-col gap-1">
      {/* 原有的订单状态徽章 */}
      <Badge>...</Badge>
      
      {/* 新增的退款状态徽章 */}
      <RefundStatusBadge 
        refundStatus={adminOrder?.refund_status || null}
        paymentStatus={adminOrder?.payment_status || undefined}
        requestedAmount={adminOrder?.requested_refund_amount || undefined}
        approvedAmount={adminOrder?.approved_refund_amount || undefined}
        showDetails={false}
      />
    </div>
  );
};
```

## 管理员订单列表增强

### 修改文件
- `app/admin/components/OrderTable.tsx`

### 主要更新

#### 1. 新增列标题
```html
<!-- 新增的列 -->
<th>Payment Status</th>
<th>Refund Status</th>
```

#### 2. 支付状态显示
```typescript
// 支付状态徽章
<span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
  order.admin_orders.payment_status === 'paid' 
    ? 'bg-green-100 text-green-800'
    : order.admin_orders.payment_status === 'unpaid'
    ? 'bg-yellow-100 text-yellow-800'
    : 'bg-gray-100 text-gray-800'
}`}>
  {order.admin_orders.payment_status}
</span>
```

#### 3. 退款状态显示
```typescript
// 退款状态组件
<RefundStatusBadge 
  refundStatus={order.admin_orders?.refund_status || null}
  paymentStatus={order.admin_orders?.payment_status || undefined}
  requestedAmount={order.admin_orders?.requested_refund_amount || undefined}
  approvedAmount={order.admin_orders?.approved_refund_amount || undefined}
  showDetails={false}
/>
```

## 状态显示优先级

### 用户端状态显示层级
1. **主要状态**: 订单工作流状态（created, pending, reviewed, paid, in_production, shipped, completed）
2. **次要状态**: 退款状态（requested, pending_confirmation, processing, processed）

### 管理员端状态显示
1. **订单状态**: PCB订单基础状态
2. **管理员订单状态**: 管理员工作流状态  
3. **支付状态**: paid, unpaid, refunded 等
4. **退款状态**: 详细的退款流程状态

## 状态徽章设计

### 颜色系统
- **绿色系**: 成功状态（paid, completed, processed）
- **蓝色系**: 进行中状态（in_production, processing）
- **黄色系**: 等待状态（pending, pending_confirmation）
- **红色系**: 问题状态（cancelled, rejected）
- **灰色系**: 默认/未知状态

### 显示原则
- **简洁性**: 只显示最重要的状态信息
- **层次性**: 主要状态突出，次要状态补充
- **一致性**: 相同状态在不同页面使用相同样式
- **信息完整性**: 不遗漏重要状态信息

## 数据流优化

### 查询优化
- 一次性获取所有需要的状态字段
- 避免多次API调用
- 利用Supabase的关联查询能力

### 状态计算
- 客户端计算状态优先级
- 智能显示最相关的状态
- 提供详细信息的快速访问

## 用户体验改进

### 用户端
- 清晰的状态分层显示
- 退款状态的实时反馈
- 状态变更的视觉提示

### 管理员端
- 更全面的订单状态概览
- 支付和退款状态的独立显示
- 快速识别需要处理的订单

## 技术实现亮点

### 1. 组件复用
- `RefundStatusBadge` 组件在多个页面复用
- 统一的状态显示逻辑
- 一致的用户体验

### 2. 类型安全
- 完整的TypeScript类型定义
- 接口字段的严格验证
- 编译时错误检查

### 3. 性能优化
- 避免不必要的重新渲染
- 智能的条件显示
- 轻量级的状态徽章组件

## 后续优化建议

### 1. 状态过滤
- 在订单列表中按退款状态过滤
- 支付状态的快速筛选
- 多状态组合查询

### 2. 状态统计
- 各状态订单数量统计
- 退款率统计分析
- 状态变更趋势图

### 3. 实时更新
- WebSocket状态推送
- 状态变更的即时反馈
- 自动刷新机制

### 4. 移动端优化
- 紧凑的移动端状态显示
- 触摸友好的交互
- 响应式状态布局

## 总结

通过这次状态显示增强，我们实现了：

✅ **完整的状态信息**: 订单、支付、退款状态全覆盖
✅ **清晰的视觉层次**: 主要和次要状态的合理分层
✅ **一致的用户体验**: 统一的状态显示组件和样式
✅ **高效的数据获取**: 优化的查询和数据结构
✅ **灵活的扩展性**: 易于添加新的状态类型

现在用户和管理员都能够快速、准确地了解订单的完整状态信息，为高效的订单管理提供了强有力的支持。 