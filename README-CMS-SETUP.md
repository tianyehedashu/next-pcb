# CMS数据库表创建指南

## 🎯 目标
为Next-PCB项目创建完整的内容管理系统（CMS）数据库表结构。

## 📋 需要创建的表

### 1. **content_categories** - 内容分类表
- 分类管理（页面、新闻、博客、帮助、法律文档）
- 支持排序和状态控制

### 2. **content_pages** - 内容页面主表
- 存储所有内容（页面、文章、新闻等）
- 支持草稿/发布/归档状态
- SEO优化字段

### 3. **content_media** - 媒体文件表
- 图片、文档等媒体文件管理
- 支持alt文本和元数据

### 4. **content_tags** - 标签表
- 灵活的内容标签系统
- 颜色编码支持

### 5. **content_page_tags** - 页面标签关联表
- 多对多关系表
- 支持一个页面多个标签

## 🚀 执行步骤

### 方法1: Supabase控制台（推荐）

1. **打开Supabase控制台**
   ```
   https://supabase.com/dashboard/project/vwhrmcwmmaslyieqgiav/sql
   ```

2. **复制SQL内容**
   - 打开文件: `lib/data/migrations/20241201_add_content_management.sql`
   - 复制全部内容

3. **执行SQL**
   - 粘贴到SQL编辑器中
   - 点击"RUN"按钮
   - 等待执行完成

### 方法2: 使用Supabase CLI

```bash
# 如果已安装Supabase CLI
supabase db push --db-url "postgresql://postgres:[password]@db.vwhrmcwmmaslyieqgiav.supabase.co:5432/postgres"
```

## ✅ 验证安装

创建完成后，您应该看到以下表：

```sql
-- 验证表存在
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE 'content_%';
```

期望结果：
- content_categories
- content_media  
- content_page_tags
- content_pages
- content_tags

## 🔒 安全特性

- ✅ **RLS（行级安全）已启用**
- ✅ **管理员权限控制**
- ✅ **公开内容只读访问**
- ✅ **外键约束保证数据完整性**

## 📊 默认数据

执行后将自动创建：

### 默认分类：
1. Pages - 静态页面
2. News - 公司新闻
3. Blog - 技术文章
4. Help - 帮助文档
5. Legal - 法律文档

### 默认标签：
1. PCB Manufacturing
2. Quality Control  
3. Technical Guide
4. Company News
5. Product Update

## 🎨 特性说明

### 内容管理
- **富文本编辑器**支持
- **多种内容类型**（页面、文章、新闻、帮助）
- **草稿/发布状态**管理
- **SEO优化**（meta标题、描述）

### 媒体管理
- **文件上传**和存储
- **图片尺寸**和元数据
- **Alt文本**用于可访问性

### 权限控制
- **管理员**可以创建、编辑、删除所有内容
- **公众用户**只能查看已发布的内容
- **作者关联**追踪内容创建者

## 🔧 故障排除

### 如果执行失败：

1. **检查数据库连接**
   ```sql
   SELECT version();
   ```

2. **检查profiles表是否存在**
   ```sql
   SELECT * FROM information_schema.tables WHERE table_name = 'profiles';
   ```

3. **逐步执行**
   - 如果整个脚本失败，可以分段执行
   - 先创建表结构
   - 再创建索引和策略
   - 最后插入默认数据

### 常见错误：

- **权限不足**: 确保使用service_role密钥
- **表已存在**: 脚本使用`IF NOT EXISTS`，安全重复执行
- **外键约束**: 确保profiles表已存在

## 📞 需要帮助？

如果遇到问题：
1. 检查Supabase项目状态
2. 验证API密钥权限
3. 查看数据库日志
4. 联系技术支持

---

**执行完成后，您的CMS系统就可以开始使用了！** ✨ 