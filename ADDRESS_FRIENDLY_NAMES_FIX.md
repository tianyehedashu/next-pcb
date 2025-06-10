# Shipping Information 地址友好名称修复方案

## 问题描述

在 Shipping Information 中，地址保存时只保存了代号（如国家代码 "US"、州代码 "CA"），而没有保存对应的友好名称（如 "United States"、"California"），导致显示时只能看到代号而不是可读的名称。

## 根本原因

1. **数据库表结构缺少友好名称字段**：`user_addresses` 表只有 `country`、`state`、`city`、`courier` 等代码字段，缺少对应的友好名称字段。

2. **API 保存逻辑不完整**：`app/api/user/addresses/route.ts` 中的 POST 方法只保存代码字段，没有保存友好名称。

3. **前端已支持但数据库未持久化**：`AddressFormComponent` 已经在内存中支持友好名称，但数据库没有对应字段存储。

## 修复方案

### 1. 数据库表结构更新

在 `supaddl.sql` 中为 `user_addresses` 表添加了友好名称字段：

```sql
-- 新增字段
country_name VARCHAR(100), -- 国家友好名称，如 "United States"
state_name VARCHAR(100),   -- 州/省友好名称，如 "California"  
city_name VARCHAR(100),    -- 城市友好名称，如 "Los Angeles"
courier_name VARCHAR(100)  -- 快递公司友好名称，如 "DHL"
```

### 2. API 路由更新

更新了 `app/api/user/addresses/route.ts`：

- **GET 方法**：返回时包含友好名称字段
- **POST 方法**：保存时同时保存代码和友好名称
- **字段映射**：在前端格式和数据库格式之间正确转换

### 3. 数据库迁移脚本

创建了 `scripts/add_address_friendly_names.sql` 迁移脚本：

- 添加新的友好名称字段
- 为现有数据填充常见的友好名称映射
- 创建性能优化索引

## 执行步骤

### 1. 运行数据库迁移

```bash
# 在 Supabase 控制台的 SQL Editor 中运行
psql -h your-host -U your-user -d your-db -f scripts/add_address_friendly_names.sql

# 或者直接在 Supabase Dashboard 的 SQL Editor 中复制粘贴执行
```

### 2. 验证修复效果

1. 打开报价页面的地址输入组件
2. 选择国家、州、城市和快递公司
3. 保存地址
4. 在地址列表中查看，应该显示友好名称而不是代码
5. 重新选择保存的地址，确认名称正确显示

### 3. 数据格式示例

修复后的地址数据格式：

```json
{
  "id": "123",
  "country": "US",
  "countryName": "United States",
  "state": "CA", 
  "stateName": "California",
  "city": "los-angeles",
  "cityName": "Los Angeles", 
  "courier": "dhl",
  "courierName": "DHL",
  "address": "123 Main Street",
  "zipCode": "90210",
  "contactName": "John Doe",
  "phone": "+1234567890"
}
```

## 技术细节

### 数据库字段映射

| 前端字段 | 数据库字段 | 说明 |
|---------|-----------|------|
| `country` | `country` | 国家代码 |
| `countryName` | `country_name` | 国家友好名称 |
| `state` | `state` | 州/省代码 |
| `stateName` | `state_name` | 州/省友好名称 |
| `city` | `city` | 城市代码 |
| `cityName` | `city_name` | 城市友好名称 |
| `courier` | `courier` | 快递公司代码 |
| `courierName` | `courier_name` | 快递公司友好名称 |

### 向后兼容性

- 现有代码继续工作，因为保留了原有的代码字段
- 显示逻辑优先使用友好名称，回退到代码
- 新保存的地址会同时包含代码和友好名称

## 注意事项

1. **生产环境部署**：先运行数据库迁移脚本，再部署代码更新
2. **数据一致性**：迁移脚本会为现有数据填充友好名称
3. **性能影响**：新增字段和索引对性能影响很小
4. **测试建议**：在开发环境先测试完整流程

## 相关文件

- `supaddl.sql` - 主数据库表结构
- `scripts/add_address_friendly_names.sql` - 迁移脚本  
- `app/api/user/addresses/route.ts` - 地址 API 路由
- `app/quote2/components/AddressFormComponent.tsx` - 地址表单组件
- `app/quote2/components/QuoteForm.tsx` - 报价表单组件 