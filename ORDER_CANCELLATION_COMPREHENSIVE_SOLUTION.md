# 用户订单取消功能 - 全面解决方案

## 需求分析

### 核心需求
1. **状态判断取消权限** - 根据订单当前状态判断是否允许取消
2. **列表操作便捷性** - 在订单列表中直接提供取消操作
3. **已取消订单默认隐藏** - 提升用户体验，避免干扰
4. **取消记录完整性** - 记录取消时间、原因等信息
5. **权限和限制控制** - 防止误操作和恶意取消

### 扩展需求
1. **取消原因记录** - 用户选择或输入取消原因
2. **取消通知机制** - 通知管理员订单被取消
3. **取消后限制** - 已付款订单的取消处理
4. **批量操作支持** - 批量取消多个订单
5. **撤销机制** - 短时间内允许撤销取消操作

## 技术方案设计

### 1. 数据库设计增强

#### 新增字段（pcb_quotes表）
```sql
ALTER TABLE pcb_quotes ADD COLUMN cancelled_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;
ALTER TABLE pcb_quotes ADD COLUMN cancellation_reason TEXT DEFAULT NULL;
ALTER TABLE pcb_quotes ADD COLUMN cancelled_by VARCHAR(50) DEFAULT NULL; -- 'user' | 'admin' | 'system'
ALTER TABLE pcb_quotes ADD COLUMN can_be_uncancelled BOOLEAN DEFAULT FALSE;
```

#### 字段说明
- `cancelled_at`: 取消时间
- `cancellation_reason`: 取消原因
- `cancelled_by`: 取消操作者（用户/管理员/系统）
- `can_be_uncancelled`: 是否允许撤销（24小时内且未付款）

### 2. 取消权限逻辑

#### 可取消状态
```typescript
const CANCELLABLE_STATUSES = [
  'created',     // 刚创建
  'pending',     // 待审核
  'quoted',      // 已报价（未确认）
  'reviewed'     // 已审核（未付款）
];

const UNCANCELLABLE_STATUSES = [
  'paid',           // 已付款（需特殊处理）
  'in_production',  // 生产中
  'shipped',        // 已发货
  'delivered',      // 已交付
  'completed',      // 已完成
  'cancelled'       // 已取消
];
```

#### 特殊情况处理
- **已付款订单**: 只能申请退款，不能直接取消
- **生产中订单**: 需管理员审批才能取消
- **已发货订单**: 不允许取消，只能退货

### 3. 前端UI增强

#### 3.1 订单列表增强功能
1. **快速取消按钮** - 在操作列添加取消按钮
2. **批量取消** - 支持选择多个订单批量取消
3. **状态筛选增强** - 添加"已取消"选项和"显示已取消"切换
4. **取消原因快速选择** - 预设常用取消原因

#### 3.2 取消确认对话框
```typescript
interface CancellationDialog {
  reason: string;           // 取消原因
  customReason?: string;    // 自定义原因
  confirmText: string;      // 确认文本输入
  notifications: {
    adminNotify: boolean;   // 通知管理员
    userEmail: boolean;     // 发送确认邮件
  };
}
```

#### 3.3 已取消订单显示
- **默认隐藏**: 已取消订单默认不在主列表显示
- **切换显示**: 提供"显示已取消订单"切换开关
- **专门入口**: 侧边栏提供"已取消订单"专门入口
- **视觉区分**: 已取消订单使用不同的视觉样式

### 4. API接口设计

#### 4.1 取消订单API
```typescript
// POST /api/user/orders/[id]/cancel
interface CancelOrderRequest {
  reason: string;
  customReason?: string;
  notifyAdmin?: boolean;
}

interface CancelOrderResponse {
  success: boolean;
  cancellationId: string;
  canUndo: boolean;
  undoExpiresAt: string;
}
```

#### 4.2 批量取消API
```typescript
// POST /api/user/orders/bulk-cancel
interface BulkCancelRequest {
  orderIds: string[];
  reason: string;
  customReason?: string;
}
```

#### 4.3 撤销取消API
```typescript
// POST /api/user/orders/[id]/undo-cancel
interface UndoCancelResponse {
  success: boolean;
  restoredStatus: string;
}
```

### 5. 业务逻辑实现

#### 5.1 取消权限检查
```typescript
function canCancelOrder(order: Order): {
  canCancel: boolean;
  reason?: string;
  requiresApproval?: boolean;
} {
  const status = order.status;
  const adminOrder = order.admin_orders;
  
  // 基本状态检查
  if (!CANCELLABLE_STATUSES.includes(status)) {
    if (status === 'paid') {
      return {
        canCancel: false,
        reason: 'Paid orders cannot be cancelled. Please request a refund instead.'
      };
    }
    return {
      canCancel: false,
      reason: `Orders with status "${status}" cannot be cancelled.`
    };
  }
  
  // 管理员订单状态检查
  if (adminOrder?.status === 'in_production') {
    return {
      canCancel: true,
      requiresApproval: true,
      reason: 'This order is in production and requires admin approval to cancel.'
    };
  }
  
  return { canCancel: true };
}
```

#### 5.2 取消后处理逻辑
```typescript
async function processOrderCancellation(orderId: string, request: CancelOrderRequest) {
  const cancellationTime = new Date().toISOString();
  
  // 1. 更新订单状态
  await updateOrderStatus(orderId, {
    status: 'cancelled',
    cancelled_at: cancellationTime,
    cancellation_reason: request.customReason || request.reason,
    cancelled_by: 'user',
    can_be_uncancelled: true // 24小时内可撤销
  });
  
  // 2. 取消相关支付意向
  await cancelPaymentIntent(orderId);
  
  // 3. 发送通知
  if (request.notifyAdmin) {
    await notifyAdminOrderCancelled(orderId, request);
  }
  
  // 4. 设置撤销过期任务
  await scheduleUndoExpiration(orderId, 24); // 24小时后不可撤销
  
  return {
    cancellationId: generateCancellationId(),
    canUndo: true,
    undoExpiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
  };
}
```

### 6. 用户体验优化

#### 6.1 操作反馈
- **即时反馈**: 取消操作立即在UI中反映
- **撤销提示**: 取消后显示撤销选项（24小时内）
- **进度指示**: 批量操作显示进度条
- **错误处理**: 详细的错误信息和建议操作

#### 6.2 信息提示
- **取消影响说明**: 清楚说明取消的后果
- **时间限制提醒**: 提醒用户撤销的时间限制
- **替代操作建议**: 对不能取消的订单提供替代方案

#### 6.3 智能默认值
- **自动原因推荐**: 根据订单状态推荐取消原因
- **记忆用户偏好**: 记住用户常用的取消原因
- **批量操作优化**: 智能批量选择相似状态的订单

### 7. 安全和限制

#### 7.1 防误操作机制
- **二次确认**: 重要订单取消需要输入确认文本
- **冷却时间**: 防止频繁取消操作
- **批量限制**: 单次批量取消数量限制

#### 7.2 审计和监控
- **操作日志**: 记录所有取消操作的详细日志
- **异常检测**: 检测异常的取消模式
- **数据完整性**: 确保取消操作的数据一致性

## 实施步骤

### 阶段1: 基础功能 (优先级: 高)
1. ✅ 数据库字段添加
2. ✅ 基础取消API实现
3. ✅ 订单列表快速取消按钮
4. ✅ 已取消订单默认隐藏逻辑

### 阶段2: 增强体验 (优先级: 中)
1. 🔄 取消原因选择对话框
2. 🔄 撤销取消功能
3. 🔄 管理员通知系统
4. 🔄 批量取消功能

### 阶段3: 高级功能 (优先级: 低)
1. ⏳ 智能取消推荐
2. ⏳ 取消分析报告
3. ⏳ 自动化取消规则
4. ⏳ 客服集成

## 成功指标

### 用户体验指标
- 取消操作完成率 > 95%
- 用户满意度 > 4.5/5
- 误操作率 < 2%
- 客服咨询量减少 > 30%

### 技术指标
- API响应时间 < 500ms
- 数据一致性 100%
- 错误率 < 0.1%
- 系统可用性 > 99.9%

### 业务指标
- 取消订单处理效率提升 > 80%
- 管理员工作量减少 > 50%
- 客户流失率降低 > 20% 