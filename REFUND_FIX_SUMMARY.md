# 退款功能修复总结

## 问题描述

退款功能遇到以下两个关键问题：

1. **Next.js 15 异步 params 错误**：
   ```
   Error: Route "/api/user/orders/[id]/request-refund" used `params.id`. 
   `params` should be awaited before using its properties.
   ```

2. **数据库字段缺失错误**：
   ```
   Could not find the 'refund_request_at' column of 'admin_orders' in the schema cache
   ```

## 数据库现状分析（基于实际表结构）

### ✅ **admin_orders 表已存在的退款相关字段**
- `refund_status` (text) - 退款状态
- `requested_refund_amount` (numeric) - 请求退款金额  
- `approved_refund_amount` (numeric) - 批准退款金额
- `payment_status` (varchar(32)) - 支付状态（支持'refunded'）
- `payment_method` (text) - 支付方式

### ❌ **缺失的退款管理字段**（需要添加）
- `refund_request_at` - 退款请求时间
- `actual_refund_amount` - 实际退款金额
- `refund_processed_at` - 退款处理时间
- `user_refund_confirmation_at` - 用户确认时间
- `refunded_at` - 退款完成时间
- `refund_note` - 退款备注
- `refund_reason` - 退款原因
- `stripe_refund_id` - Stripe退款ID
- `order_status` - 订单状态（用于退款策略）

## 修复方案

### 1. API 文件修复 (Next.js 15 兼容) ✅

修复了以下 API 文件中的异步 params 问题：

- `app/api/user/orders/[id]/request-refund/route.ts`
- `app/api/user/orders/[id]/confirm-refund/route.ts` 
- `app/api/admin/orders/[id]/review-refund/route.ts`
- `app/api/admin/orders/[id]/process-refund/route.ts`
- `app/api/admin/users/[id]/reset-password/route.ts`

**修改前：**
```typescript
{ params }: { params: { id: string } }
const orderId = params.id;
```

**修改后：**
```typescript
{ params }: { params: Promise<{ id: string }> }
const { id: orderId } = await params;
```

### 2. 数据库结构补充

创建了 `scripts/add_refund_fields_to_admin_orders.sql` 脚本，智能添加缺失的退款管理字段：

#### 新增时间跟踪字段
- `refund_request_at` - 退款请求时间 (TIMESTAMP WITH TIME ZONE)
- `user_refund_confirmation_at` - 用户确认时间 (TIMESTAMP WITH TIME ZONE)
- `refund_processed_at` - 处理开始时间 (TIMESTAMP WITH TIME ZONE)
- `refunded_at` - 退款完成时间 (TIMESTAMP WITH TIME ZONE)

#### 新增金额字段
- `actual_refund_amount` - 实际退款金额 (NUMERIC)

#### 新增信息字段
- `refund_reason` - 退款原因 (TEXT)
- `refund_note` - 退款备注 (TEXT)
- `stripe_refund_id` - Stripe退款ID (TEXT)
- `order_status` - 订单状态，用于退款策略 (VARCHAR(32))

#### 脚本特点
- ✅ 检测现有字段，避免重复创建
- ✅ 使用与现有表一致的数据类型 (NUMERIC, TEXT, VARCHAR(32))
- ✅ 兼容现有索引结构
- ✅ 智能跳过已存在的字段

## 完整退款状态流程

### 退款状态流转 (refund_status)
1. **null** - 无退款请求
2. **requested** - 用户已请求退款
3. **pending_confirmation** - 管理员已批准，等待用户确认  
4. **approved** - 管理员批准（备用状态）
5. **rejected** - 管理员拒绝
6. **processing** - 用户已确认，等待Stripe处理
7. **processed** - Stripe退款完成

### 支付状态更新 (payment_status)
- **paid** → **refunded** (退款完成后更新)

### 订单状态 (order_status) - 用于退款策略判断
- **paid** - 已支付 (95% 退款)
- **in_production** - 生产中 (50% 退款)
- **shipped** - 已发货 (0% 退款)
- **completed** - 已完成 (0% 退款)

## 执行修复

### 自动执行（推荐）
```powershell
.\apply-refund-fix.ps1
```

### 手动执行
1. **代码修复**：已自动完成 ✅
2. **数据库迁移**：
   ```sql
   psql "your-database-url" -f scripts/add_refund_fields_to_admin_orders.sql
   ```

## 验证修复

### 基础验证
1. 重启应用程序
2. 测试退款请求功能
3. 检查API不再返回 Next.js 15 params 错误

### 数据库验证
```sql
-- 检查新增的退款相关字段
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'admin_orders' 
  AND column_name IN (
    'refund_request_at', 'actual_refund_amount', 'refund_processed_at',
    'user_refund_confirmation_at', 'refunded_at', 'refund_note',
    'refund_reason', 'stripe_refund_id', 'order_status'
  );
```

### 功能测试流程
1. **用户请求** → `refund_status: 'requested'`, `refund_request_at: now()`
2. **管理员批准** → `refund_status: 'pending_confirmation'`, `approved_refund_amount: X`
3. **用户确认** → `refund_status: 'processing'`, `user_refund_confirmation_at: now()`
4. **Stripe处理** → `refund_status: 'processed'`, `payment_status: 'refunded'`, `refunded_at: now()`

## 技术特点

### 数据一致性
- 使用现有表的数据类型规范 (NUMERIC 而非 DECIMAL)
- 遵循现有字段命名约定
- 与现有 UUID 主键和约束兼容

### 性能优化
- 仅为新增字段创建必要索引
- 复用现有的 payment_status 索引
- 避免重复索引创建

### 安全性
- 所有新字段默认值为 NULL，不影响现有数据
- 幂等性脚本，可安全重复执行
- 完整的字段检查和错误处理

## 注意事项

- ✅ **兼容性确认**：基于实际表结构设计，完全兼容
- ✅ **生产安全**：新字段不影响现有功能，可安全部署
- ✅ **Next.js 15 兼容**：所有API已修复异步params问题
- ✅ **完整工作流**：支持从请求到完成的全流程退款管理
- ✅ **Stripe集成**：包含完整的第三方支付跟踪字段 