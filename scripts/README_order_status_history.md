# 订单状态历史表创建指南

## 概述

`order_status_history` 表用于记录所有订单状态变更的审计日志，确保状态变更的可追溯性和透明度。

## 执行步骤

### 1. 创建基础表结构和 RLS 策略

```bash
# 在数据库中执行
psql -d your_database -f scripts/create_order_status_history_table.sql
```

⚠️ **重要提示**：如果遇到 `syntax error at or near "NOT"` 错误，说明您的 PostgreSQL 版本不支持 `ADD CONSTRAINT IF NOT EXISTS` 语法。脚本已经修复此问题，使用兼容性更好的语法。

这个脚本会创建：
- ✅ `order_status_history` 表结构
- ✅ 性能优化索引
- ✅ 外键约束（如果相关表存在，带重复检查）
- ✅ RLS 安全策略（带重复检查）
- ✅ 表和字段注释

### 2. 创建自动触发器（可选但推荐）

```bash
# 在数据库中执行
psql -d your_database -f scripts/create_order_status_triggers.sql
```

这个脚本会创建：
- ✅ 用户订单状态变更触发器函数
- ✅ `pcb_quotes` 表状态变更触发器
- ✅ 管理员订单状态变更触发器函数
- ✅ `admin_orders` 表状态变更触发器
- ✅ 便捷查询函数
- ✅ 详细视图

## 表结构说明

### 主要字段

| 字段名 | 类型 | 说明 |
|--------|------|------|
| `id` | UUID | 主键ID |
| `order_id` | UUID | 关联的订单ID（pcb_quotes.id） |
| `from_status` | VARCHAR(50) | 原状态（可为空表示初始状态） |
| `to_status` | VARCHAR(50) | 新状态 |
| `changed_by` | UUID | 操作人员ID（auth.users.id） |
| `changed_by_role` | VARCHAR(20) | 操作人员角色：admin/user/system |
| `changed_by_name` | VARCHAR(255) | 操作人员姓名或邮箱 |
| `reason` | TEXT | 状态变更原因 |
| `metadata` | JSONB | 额外的元数据 |
| `ip_address` | VARCHAR(45) | 操作IP地址 |
| `user_agent` | TEXT | 用户代理字符串 |
| `created_at` | TIMESTAMP | 记录创建时间 |

### RLS 策略

1. **管理员权限**：可以查看所有状态历史
2. **用户权限**：只能查看自己订单的状态历史
3. **游客权限**：可以查看自己邮箱相关的订单状态历史
4. **插入权限**：只有系统和管理员可以插入记录
5. **保护机制**：禁止更新和删除历史记录

## 使用示例

### 查询订单状态历史

```sql
-- 用户查看自己的订单状态历史
SELECT * FROM order_status_history 
WHERE order_id = 'your-order-id' 
ORDER BY created_at DESC;

-- 使用便捷函数查询
SELECT * FROM get_order_status_history('your-order-id');
```

### 管理员查询

```sql
-- 查看所有状态变更
SELECT * FROM order_status_history 
ORDER BY created_at DESC 
LIMIT 100;

-- 查看详细信息（包含用户信息）
SELECT * FROM order_status_history_with_details 
ORDER BY created_at DESC 
LIMIT 50;

-- 查看特定状态的变更
SELECT * FROM order_status_history 
WHERE to_status = 'paid' 
ORDER BY created_at DESC;
```

### 统计查询

```sql
-- 统计各状态变更次数
SELECT 
  to_status,
  COUNT(*) as change_count
FROM order_status_history 
GROUP BY to_status 
ORDER BY change_count DESC;

-- 统计各用户角色的操作次数
SELECT 
  changed_by_role,
  COUNT(*) as operation_count
FROM order_status_history 
GROUP BY changed_by_role;
```

## 自动触发器说明

### 触发时机

- **用户订单状态变更**：当 `pcb_quotes.status` 字段更新时自动记录
- **管理员订单状态变更**：当 `admin_orders.status` 字段更新时自动记录

### 触发器功能

1. **自动识别操作人员**：根据当前认证用户确定操作者
2. **角色判断**：自动判断是管理员、普通用户还是系统操作
3. **元数据记录**：记录操作相关的额外信息
4. **错误处理**：触发器失败不会阻断主要业务流程

## 注意事项

1. **执行顺序**：必须先创建基础表，再创建触发器
2. **权限要求**：需要数据库管理员权限执行这些脚本
3. **性能影响**：触发器会轻微影响写入性能，但提供了重要的审计功能
4. **存储空间**：状态历史会持续增长，建议定期归档旧数据

## 故障排除

### 常见问题

1. **语法错误 `syntax error at or near "NOT"`**：
   - 原因：PostgreSQL 版本不支持 `ADD CONSTRAINT IF NOT EXISTS` 语法
   - 解决：脚本已修复，使用兼容性更好的检查方式
   
2. **外键约束失败**：确保 `pcb_quotes` 和 `auth.users` 表存在

3. **触发器创建失败**：检查相关表是否存在

4. **权限问题**：确保执行用户有足够的数据库权限

5. **重复执行脚本**：脚本支持重复执行，会自动检查并跳过已存在的对象

### 检查脚本

```sql
-- 检查表是否创建成功
SELECT table_name FROM information_schema.tables 
WHERE table_name = 'order_status_history';

-- 检查触发器是否创建成功
SELECT trigger_name, event_object_table 
FROM information_schema.triggers 
WHERE trigger_name LIKE '%status_change%';

-- 检查 RLS 策略
SELECT schemaname, tablename, policyname 
FROM pg_policies 
WHERE tablename = 'order_status_history';
```

## 维护建议

1. **定期清理**：建议定期归档超过一年的历史记录
2. **监控性能**：监控触发器对写入性能的影响
3. **备份策略**：确保状态历史数据包含在备份中
4. **访问审计**：定期审查访问日志确保数据安全 