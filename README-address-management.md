# 用户地址管理功能

## 功能概述

用户地址管理功能允许用户在个人资料页面中管理他们的收货地址，包括添加、编辑、删除和设置默认地址。

## 主要特性

### 1. 地址列表展示
- 显示所有已保存的地址
- 清晰展示联系人信息、详细地址和快递偏好
- 标识默认地址
- 响应式设计，适配移动端和桌面端

### 2. 地址管理操作
- **添加新地址**: 通过弹窗表单添加新的收货地址
- **编辑地址**: 修改现有地址信息
- **删除地址**: 删除不需要的地址（需确认）
- **设置默认地址**: 将任意地址设为默认收货地址

### 3. 地址表单功能
- 国家/地区选择（支持主要国家）
- 省/州和城市级联选择（基于GeoNames API）
- 详细地址输入
- 联系人信息（姓名、电话）
- 快递公司偏好选择（DHL、FedEx、UPS）
- 地址标签（如"家庭"、"办公室"等）

## 技术实现

### 数据库结构
使用 `user_addresses` 表存储地址信息：
```sql
create table user_addresses (
  id bigint generated by default as identity primary key,
  user_id uuid references auth.users(id) not null,
  label varchar(100),
  contact_name varchar(100) not null,
  phone varchar(50) not null,
  country varchar(10) not null,
  country_name varchar(100),
  state varchar(100),
  state_name varchar(100),
  city varchar(100),
  city_name varchar(100),
  address text not null,
  zip_code varchar(20),
  courier varchar(50),
  courier_name varchar(100),
  is_default boolean default false,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);
```

### API 端点
- `GET /api/user/addresses` - 获取用户地址列表
- `POST /api/user/addresses` - 创建或更新地址
- `DELETE /api/user/addresses` - 删除地址
- `PUT /api/user/addresses` - 设置默认地址

### 前端组件
- `AddressManagementPage` - 主要的地址管理页面
- `AddressFormComponent` - 可复用的地址表单组件
- `ProfileSidebar` - 包含地址管理链接的侧边栏

## 用户界面

### 访问路径
用户可以通过以下方式访问地址管理：
1. 个人资料页面 → 侧边栏 → "Shipping Addresses"
2. 直接访问 `/profile/address`

### 页面布局
- **标题区域**: 显示页面标题和"添加新地址"按钮
- **地址列表**: 卡片式展示所有地址，包含完整信息和操作按钮
- **空状态**: 当没有地址时显示引导用户添加第一个地址
- **弹窗表单**: 用于添加和编辑地址的模态对话框

### 响应式设计
- 移动端：垂直布局，操作按钮堆叠
- 桌面端：水平布局，操作按钮并排显示
- 表单在大屏幕上使用多列布局

## 安全性

### 数据保护
- 使用 Supabase RLS (Row Level Security) 确保用户只能访问自己的地址
- API 端点需要有效的认证令牌
- 所有数据库操作都包含用户ID验证

### 输入验证
- 前端表单验证必填字段
- 后端API验证数据完整性
- 防止SQL注入和XSS攻击

## 使用流程

### 添加第一个地址
1. 用户访问地址管理页面
2. 点击"Add Your First Address"按钮
3. 填写地址表单
4. 第一个地址自动设为默认地址
5. 保存成功后显示在地址列表中

### 管理现有地址
1. 在地址列表中选择要操作的地址
2. 可以进行编辑、设为默认或删除操作
3. 编辑时会在弹窗中显示预填充的表单
4. 删除前会显示确认对话框

## 集成说明

### 与报价系统集成
- 地址管理功能与报价系统共享 `AddressFormComponent`
- 用户在报价时可以选择已保存的地址
- 支持在报价过程中保存新地址

### 与订单系统集成
- 订单创建时可以使用保存的地址
- 地址信息会作为快照保存在订单中
- 支持默认地址的自动选择

## 未来扩展

### 可能的改进
1. 地址验证服务集成
2. 批量导入/导出地址
3. 地址使用频率统计
4. 更多快递公司选项
5. 地址模板功能
6. 地理位置自动填充

### 国际化支持
- 支持更多国家和地区
- 本地化地址格式
- 多语言界面支持 