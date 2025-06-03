# PCB Quote Database Schema (Simplified)

## Overview
数据库架构已简化，只保留关键字段作为独立列，其他PCB技术规格统一存储为JSON格式。这样设计更灵活，便于维护。

## `pcb_quotes` 表结构

### 关键字段（独立列）
- `id` (bigint, primary key) - 自动生成的报价ID
- `user_id` (uuid, nullable) - 用户ID，关联auth.users表，游客报价时为null
- `email` (varchar, required) - 联系邮箱，必填字段
- `phone` (varchar, optional) - 联系电话
- `status` (varchar) - 订单状态: pending, quoted, confirmed, cancelled
- `admin_quote_price` (decimal) - 管理员报价
- `admin_notes` (text) - 管理员备注
- `created_at` (timestamp) - 创建时间
- `updated_at` (timestamp) - 更新时间

### JSON字段
- `pcb_spec` (jsonb, required) - PCB技术规格，包含所有技术参数
- `shipping_address` (jsonb, optional) - 收货地址信息
- `gerber_file_url` (text, optional) - Gerber文件URL

## PCB规格字段（存储在pcb_spec JSON中）

### 基本信息
- `pcbType` (string) - PCB类型: Standard, Flexible, Rigid-Flex
- `layers` (number) - 层数: 1-32
- `quantity` (number) - 数量
- `delivery` (string) - 交期要求

### 尺寸规格
- `singleLength` (number) - 单板长度(mm)
- `singleWidth` (number) - 单板宽度(mm)
- `thickness` (string) - 板厚度
- `panelCount` (number) - 拼板数量
- `border` (string) - 边界设计

### 材料工艺
- `surfaceFinish` (string) - 表面处理: HASL, OSP, ENIG等
- `copperWeight` (string) - 铜厚度
- `solderMask` (string) - 阻焊颜色
- `silkscreen` (string) - 丝印颜色
- `tg` (string) - Tg值
- `hdi` (string) - HDI类型

### 特殊工艺
- `goldFingers` (string) - 金手指
- `castellated` (string) - 半孔工艺
- `impedance` (string) - 阻抗控制
- `flyingProbe` (string) - 飞针测试
- `edgePlating` (string) - 侧面电镀
- `halfHole` (string) - 半孔加工

### 测试要求
- `testMethod` (string) - 测试方法
- `productReport` (array) - 产品报告要求
- `qualityAttach` (string) - 品质附件

### 其他选项
- `shipmentType` (string) - 运输方式
- `payMethod` (string) - 付款方式
- `customerCode` (string) - 客户代码
- `smt` (string) - SMT贴片服务

## 地址表结构 (`user_addresses`)

### 字段说明
- `id` (bigint, primary key) - 地址ID
- `user_id` (uuid, required) - 用户ID
- `label` (varchar) - 地址标签，如"Home", "Office"
- `contact_name` (varchar, required) - 联系人姓名
- `phone` (varchar, required) - 联系电话
- `country` (varchar, required) - 国家代码
- `state` (varchar) - 省/州
- `city` (varchar) - 城市
- `address` (text, required) - 详细地址
- `zip_code` (varchar) - 邮编
- `courier` (varchar) - 首选快递
- `is_default` (boolean) - 是否默认地址
- `created_at` (timestamp) - 创建时间
- `updated_at` (timestamp) - 更新时间

## 订单表结构 (`orders`)

### 字段说明
- `id` (bigint, primary key) - 订单ID
- `quote_id` (bigint, required) - 关联的报价ID
- `user_id` (uuid) - 用户ID
- `shipping_address` (jsonb, required) - 收货地址快照
- `pcb_spec` (jsonb, required) - PCB规格快照
- `gerber_file_url` (text) - Gerber文件URL
- `quoted_price` (decimal) - 报价金额
- `shipping_cost` (decimal) - 运费
- `total_amount` (decimal) - 总金额
- `production_days` (integer) - 生产周期（天）
- `estimated_delivery_date` (date) - 预计交付日期
- `status` (varchar) - 订单状态
- `payment_status` (varchar) - 支付状态
- `admin_notes` (text) - 管理员备注
- `user_notes` (text) - 用户备注
- `created_at` (timestamp) - 创建时间
- `updated_at` (timestamp) - 更新时间

## 优势

1. **简化维护**: 减少了大量独立字段，降低了架构复杂度
2. **灵活扩展**: 新增PCB规格字段只需修改JSON结构，无需更改数据库架构
3. **性能优化**: 通过JSONB类型支持高效的JSON查询和索引
4. **数据完整性**: 关键业务字段独立存储，确保查询性能和数据一致性
5. **向后兼容**: 现有代码只需调整数据结构，核心逻辑无需大改

## 迁移说明

前端代码需要调整：
- 提交报价时将PCB规格字段合并为`pcb_spec`对象
- 显示报价详情时从`pcb_spec`JSON中提取相应字段
- 地址管理使用新的`user_addresses`表结构

## RLS (Row Level Security) 策略

### PCB报价表 (`pcb_quotes`)
- **查看权限**: 用户只能查看自己的报价（通过`user_id`匹配），游客可以通过邮箱匹配查看自己的报价
- **插入权限**: 已登录用户只能插入`user_id`为自己ID的报价，游客可以插入`user_id`为null的报价
- **更新权限**: 用户只能更新自己的报价
- **管理员权限**: 通过Service Role Key绕过RLS限制，可以查看和管理所有报价

### 用户地址表 (`user_addresses`)
- **完全隔离**: 用户只能查看、插入、更新、删除自己的地址记录
- **严格验证**: 所有操作都验证`user_id`必须匹配当前认证用户

### 订单表 (`orders`)
- **查看权限**: 用户只能查看自己的订单
- **插入权限**: 系统级操作（通过后端API控制）
- **更新权限**: 用户只能更新自己订单的用户备注字段

### 安全特性
1. **数据隔离**: 确保用户只能访问自己的数据
2. **游客支持**: 游客报价通过邮箱匹配进行访问控制
3. **管理员支持**: 提供管理员角色检查函数
4. **性能优化**: 为RLS查询创建专门的索引
5. **API安全**: 结合JWT令牌和Service Role Key提供多层安全保护

### 使用说明
- **前端调用**: 使用用户的JWT令牌进行API调用
- **管理员操作**: 使用Service Role Key绕过RLS限制
- **游客操作**: 使用Service Role Key处理游客报价的创建 