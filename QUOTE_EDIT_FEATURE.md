# PCB 报价编辑功能实现

## 功能概述

为 PCB 报价系统添加了编辑功能，允许用户和管理员在特定条件下修改已提交的报价。

## 使用方式

通过 URL 参数访问编辑模式：
```
/quote2?edit=<quote_id>
```

例如：
```
/quote2?edit=aba642d6-1a20-4ac5-a466-4fbc8fdf5fa0
```

## 权限控制

### 管理员权限
- ✅ 可以编辑所有报价
- ✅ 编辑后状态保持不变
- ✅ 可以修改任何状态的订单

### 普通用户权限
- ✅ 只能编辑自己的报价
- ✅ 只能编辑特定状态的报价：`pending`、`draft`、`created`
- ❌ 不能编辑已报价（`quoted`）或已支付（`paid`）的订单
- ✅ 编辑已报价订单后，状态自动变为 `pending`（待审核）

### 游客用户权限
- ✅ 可以编辑自己的报价（通过邮箱匹配）
- ✅ 只能编辑特定状态的报价：`pending`、`draft`、`created`
- ❌ 需要额外的邮箱验证（待实现）

## 状态流转逻辑

### 用户编辑订单
```
pending → pending (保持不变)
draft → draft (保持不变)
created → created (保持不变)
quoted → pending (重新审核)
paid → 不允许编辑
```

### 管理员编辑订单
```
任何状态 → 保持原状态 (管理员决定)
```

## 技术实现

### 前端组件修改

1. **QuotePageClient.tsx**
   - 添加 `editId` 参数支持
   - 传递编辑 ID 到 QuoteForm 组件

2. **QuoteForm.tsx**
   - 添加编辑模式状态管理
   - 实现数据加载和权限检查
   - 修改提交逻辑支持 PUT 请求
   - 添加加载状态和错误处理
   - **数据初始化改进**：编辑模式下使用数据库数据初始化表单，而不是 store 数据
   - 防止编辑模式下表单数据被 store 数据覆盖
   - 正确处理 PCB 规格、地址信息和 Gerber 文件 URL 的初始化

### API 路由

3. **app/api/quote/[id]/route.ts** - 用户订单编辑 API
   - `GET` 方法：获取单个报价数据（包含关联的管理员订单）
   - `PUT` 方法：更新报价数据
   - **状态管理增强**：
     - 定义完整的状态枚举和转换规则
     - 用户和管理员不同的编辑权限控制
     - 状态转换合法性验证
     - 自动同步更新管理员订单状态
     - 记录状态变更历史

4. **app/api/admin/orders/[id]/status/route.ts** - 管理员订单状态管理 API
   - `PUT` 方法：更新管理员订单状态
   - `GET` 方法：获取可用的状态转换选项
   - **管理员专用功能**：
     - 管理员订单状态转换规则
     - 双向状态同步（管理员订单 ↔ 用户订单）
     - 状态变更历史记录
     - 状态转换权限验证

### 权限检查函数

```typescript
// 检查访问权限
function checkAccessPermission(quote, user): boolean

// 检查编辑权限  
function checkEditPermission(quote, user): boolean

// 检查管理员角色
async function checkAdminRole(userId, supabase): Promise<boolean>
```

## 用户体验

### 加载状态
- 编辑模式下显示"Loading quote data..."
- 表单数据自动填充

### 错误处理
- 权限不足：显示"Access Denied"
- 订单不存在：显示"Quote not found"
- 状态不允许编辑：显示具体状态信息

### 视觉反馈
- 编辑模式下标题显示"Edit PCB Quote"
- 提交按钮文本根据模式变化
- 成功提示区分新建和编辑

## 安全考虑

1. **身份验证**
   - 所有编辑操作需要有效的认证令牌
   - 游客编辑需要邮箱验证（待完善）

2. **权限验证**
   - 服务端双重验证用户权限
   - 前端权限检查仅用于 UI 优化
   - **状态级权限控制**：不同状态下的编辑权限不同

3. **数据完整性**
   - 编辑时保留原有的关键字段
   - 状态变更遵循业务逻辑
   - **状态转换验证**：防止非法状态跳转
   - **双表同步**：确保用户订单表和管理员订单表状态一致

4. **审计追踪**
   - 记录所有状态变更历史
   - 追踪操作人员和变更原因
   - 支持状态变更回溯

## 测试

### 测试页面
- `/test-edit` - 验证各种编辑场景
- `/test-edit-data` - 验证数据初始化功能，显示数据库中的报价列表并支持点击编辑

### 测试场景
- 管理员编辑任意订单
- 用户编辑自己的订单
- 用户尝试编辑他人订单（应被拒绝）
- 用户尝试编辑已报价订单（状态应变为 pending）
- **数据初始化测试**：验证表单是否正确加载数据库中的数据

### 数据初始化流程
1. **编辑模式检测**：通过 URL 参数 `edit=<id>` 进入编辑模式
2. **数据加载**：从数据库加载指定 ID 的报价数据
3. **权限验证**：检查用户是否有权限编辑该报价
4. **表单初始化**：使用数据库数据而非 store 数据初始化表单
5. **数据映射**：正确映射 PCB 规格、地址信息和文件 URL
6. **状态管理**：防止 store 数据覆盖数据库数据

## 后端状态管理增强

### 状态枚举定义
```typescript
enum QuoteStatus {
  DRAFT = 'draft',
  CREATED = 'created', 
  PENDING = 'pending',
  REVIEWED = 'reviewed',
  QUOTED = 'quoted',
  UNPAID = 'unpaid',
  PAYMENT_PENDING = 'payment_pending',
  PAID = 'paid',
  IN_PRODUCTION = 'in_production',
  SHIPPED = 'shipped',
  DELIVERED = 'delivered',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  REJECTED = 'rejected',
  REFUNDED = 'refunded'
}
```

### 状态转换规则
- **用户可编辑状态**：`draft`, `created`, `pending`
- **管理员可编辑状态**：除 `completed`, `refunded` 外的所有状态
- **状态转换验证**：防止非法状态跳转
- **双向同步**：用户订单状态 ↔ 管理员订单状态

### 权限控制矩阵
| 用户类型 | 可编辑状态 | 状态转换规则 |
|---------|-----------|-------------|
| 普通用户 | draft, created, pending | 编辑 quoted 状态订单 → pending |
| 管理员 | 几乎所有状态 | 可进行大部分合理的状态转换 |
| 游客 | draft, created, pending | 需要邮箱验证（待实现） |

### 状态同步机制
1. **用户编辑订单** → 自动更新管理员订单状态
2. **管理员更新状态** → 自动同步用户订单状态  
3. **状态变更记录** → 记录到 `order_status_history` 表
4. **错误处理** → 同步失败不阻断主流程，但记录错误

## 待完善功能

1. **游客邮箱验证**
   - 发送验证码到邮箱
   - 验证码验证后允许编辑

2. **编辑历史记录**
   - 记录每次编辑的变更
   - 显示编辑历史

3. **批量编辑**
   - 管理员批量修改订单状态
   - 批量应用折扣或加价

4. **编辑锁定**
   - 防止多人同时编辑同一订单
   - 显示当前编辑者信息

## 相关文件

- `app/quote2/page.tsx` - 页面入口
- `app/quote2/components/QuotePageClient.tsx` - 客户端组件
- `app/quote2/components/QuoteForm.tsx` - 表单组件
- `app/api/quote/[id]/route.ts` - 用户订单编辑 API 路由
- `app/api/admin/orders/[id]/status/route.ts` - 管理员订单状态管理 API 路由
- `app/test-edit/page.tsx` - 基础测试页面
- `app/test-edit-data/page.tsx` - 数据初始化测试页面 