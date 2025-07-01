-- =====================================================
-- 多产品文件管理系统 - 规范化数据库设计
-- =====================================================
-- 
-- 设计原则：
-- 1. 表结构规范化，避免字段冗余
-- 2. 使用独立文件表，支持扩展
-- 3. 通过关联表建立订单-文件关系
-- 4. 保持向后兼容性
--
-- =====================================================

-- 1. 创建产品文件类型枚举
DO $$ BEGIN
    CREATE TYPE file_type_enum AS ENUM (
        'gerber',
        'drill', 
        'pick_place',
        'bom',
        'stencil_design',
        'dxf',
        'stencil_spec',
        'smt_bom',
        'smt_placement',
        'smt_assembly_drawing',
        'specification',
        'drawing',
        'document',
        'image'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. 创建文件表
CREATE TABLE IF NOT EXISTS order_files (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- 基本信息
    file_name TEXT NOT NULL,
    file_type file_type_enum NOT NULL,
    file_url TEXT NOT NULL,
    file_size BIGINT,
    content_type TEXT,
    
    -- 上传信息
    bucket_name TEXT NOT NULL DEFAULT 'documents',
    upload_path TEXT,
    uploaded_by UUID REFERENCES auth.users(id),
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- 验证状态
    validation_status TEXT DEFAULT 'pending', -- pending, valid, invalid
    validation_errors JSONB,
    validation_metadata JSONB,
    
    -- 打包信息
    is_bundled_file BOOLEAN DEFAULT FALSE,
    bundle_group TEXT, -- pcb_design, stencil_design, smt_files
    extracted_from_bundle_id UUID, -- 如果是从打包文件解压出来的，记录源文件ID
    
    -- 审计字段
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. 创建订单-文件关联表
CREATE TABLE IF NOT EXISTS order_file_relations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- 关联关系
    order_id UUID NOT NULL REFERENCES pcb_quotes(id) ON DELETE CASCADE,
    file_id UUID NOT NULL REFERENCES order_files(id) ON DELETE CASCADE,
    
    -- 关联元数据
    file_purpose TEXT, -- 文件用途说明
    is_primary BOOLEAN DEFAULT TRUE, -- 是否为该类型的主文件
    display_order INTEGER DEFAULT 0,
    
    -- 审计字段
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_by UUID REFERENCES auth.users(id),
    
    -- 唯一约束：每个订单的每种文件类型只能有一个主文件
    UNIQUE(order_id, file_id)
);

-- 4. 添加产品类型字段到订单表（如果不存在）
DO $$ BEGIN
    ALTER TABLE pcb_quotes ADD COLUMN product_type TEXT DEFAULT 'pcb';
EXCEPTION
    WHEN duplicate_column THEN null;
END $$;

-- 5. 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_order_files_type ON order_files(file_type);
CREATE INDEX IF NOT EXISTS idx_order_files_uploaded_at ON order_files(uploaded_at);
CREATE INDEX IF NOT EXISTS idx_order_files_validation_status ON order_files(validation_status);
CREATE INDEX IF NOT EXISTS idx_order_files_bundle_group ON order_files(bundle_group) WHERE bundle_group IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_order_file_relations_order_id ON order_file_relations(order_id);
CREATE INDEX IF NOT EXISTS idx_order_file_relations_file_id ON order_file_relations(file_id);
CREATE INDEX IF NOT EXISTS idx_order_file_relations_order_file_type ON order_file_relations(order_id, (
    SELECT file_type FROM order_files WHERE id = order_file_relations.file_id
));

-- 6. 创建视图：订单文件概览
CREATE OR REPLACE VIEW order_files_overview AS
SELECT 
    ofr.order_id,
    pq.product_type,
    of.file_type,
    of.file_name,
    of.file_url,
    of.file_size,
    of.validation_status,
    of.is_bundled_file,
    of.bundle_group,
    of.uploaded_at,
    ofr.is_primary,
    ofr.file_purpose
FROM order_file_relations ofr
JOIN order_files of ON ofr.file_id = of.id
JOIN pcb_quotes pq ON ofr.order_id = pq.id
WHERE ofr.is_primary = TRUE; -- 只显示主文件

-- 7. 创建函数：获取订单的文件完整性状态
CREATE OR REPLACE FUNCTION get_order_file_completeness(
    p_order_id UUID,
    p_product_type TEXT DEFAULT 'pcb'
) RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
    required_files TEXT[];
    present_files TEXT[];
    missing_files TEXT[];
    file_record RECORD;
    result JSONB;
BEGIN
    -- 根据产品类型定义必需文件
    CASE p_product_type
        WHEN 'pcb' THEN
            required_files := ARRAY['gerber'];
        WHEN 'stencil' THEN
            required_files := ARRAY['stencil_design'];
        WHEN 'smt' THEN
            required_files := ARRAY['smt_bom', 'smt_placement'];
        WHEN 'pcb_smt' THEN
            required_files := ARRAY['gerber', 'smt_bom', 'smt_placement'];
        WHEN 'hybrid' THEN
            required_files := ARRAY['gerber', 'stencil_design', 'smt_bom', 'smt_placement'];
        ELSE
            required_files := ARRAY['gerber']; -- 默认PCB
    END CASE;
    
    -- 获取已存在的文件类型
    SELECT ARRAY_AGG(DISTINCT of.file_type::TEXT)
    INTO present_files
    FROM order_file_relations ofr
    JOIN order_files of ON ofr.file_id = of.id
    WHERE ofr.order_id = p_order_id
      AND ofr.is_primary = TRUE
      AND of.validation_status != 'invalid';
    
    -- 如果没有文件，设置为空数组
    IF present_files IS NULL THEN
        present_files := ARRAY[]::TEXT[];
    END IF;
    
    -- 计算缺失文件
    SELECT ARRAY_AGG(rf)
    INTO missing_files
    FROM UNNEST(required_files) rf
    WHERE rf != ALL(present_files);
    
    -- 如果没有缺失文件，设置为空数组
    IF missing_files IS NULL THEN
        missing_files := ARRAY[]::TEXT[];
    END IF;
    
    -- 构建结果
    result := jsonb_build_object(
        'order_id', p_order_id,
        'product_type', p_product_type,
        'is_complete', array_length(missing_files, 1) IS NULL OR array_length(missing_files, 1) = 0,
        'required_files', required_files,
        'present_files', present_files,
        'missing_files', missing_files,
        'total_files', (
            SELECT COUNT(*)
            FROM order_file_relations ofr
            JOIN order_files of ON ofr.file_id = of.id
            WHERE ofr.order_id = p_order_id
        ),
        'checked_at', NOW()
    );
    
    RETURN result;
END;
$$;

-- 8. 创建触发器：自动更新 updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_order_files_updated_at 
    BEFORE UPDATE ON order_files
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 9. 创建RLS策略（行级安全）
ALTER TABLE order_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_file_relations ENABLE ROW LEVEL SECURITY;

-- 只有文件上传者和订单所有者可以访问文件
CREATE POLICY "用户可以访问自己上传的文件" ON order_files
    FOR ALL USING (uploaded_by = auth.uid());

CREATE POLICY "用户可以访问自己订单的文件" ON order_file_relations
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM pcb_quotes pq
            WHERE pq.id = order_id 
            AND pq.user_id = auth.uid()
        )
    );

-- 管理员可以访问所有文件
CREATE POLICY "管理员可以访问所有文件" ON order_files
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = auth.uid() 
            AND p.role = 'admin'
        )
    );

CREATE POLICY "管理员可以访问所有文件关联" ON order_file_relations
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = auth.uid() 
            AND p.role = 'admin'
        )
    );

-- 10. 创建便捷函数：获取订单的特定类型文件URL（向后兼容）
CREATE OR REPLACE FUNCTION get_order_file_url(
    p_order_id UUID,
    p_file_type TEXT
) RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
    file_url TEXT;
BEGIN
    SELECT of.file_url
    INTO file_url
    FROM order_file_relations ofr
    JOIN order_files of ON ofr.file_id = of.id
    WHERE ofr.order_id = p_order_id
      AND of.file_type = p_file_type::file_type_enum
      AND ofr.is_primary = TRUE
      AND of.validation_status != 'invalid'
    ORDER BY of.uploaded_at DESC
    LIMIT 1;
    
    RETURN file_url;
END;
$$;

-- 11. 数据迁移：将现有文件URL迁移到新表结构（如果有数据的话）
-- 注意：这里假设原来可能有一些文件URL字段，需要根据实际情况调整

-- 示例迁移逻辑（需要根据实际字段调整）
/*
INSERT INTO order_files (file_name, file_type, file_url, bucket_name, uploaded_by)
SELECT 
    'gerber_file.zip',
    'gerber'::file_type_enum,
    gerber_url,
    'gerber',
    user_id
FROM pcb_quotes 
WHERE gerber_url IS NOT NULL;

INSERT INTO order_file_relations (order_id, file_id, is_primary)
SELECT 
    pq.id,
    of.id,
    TRUE
FROM pcb_quotes pq
JOIN order_files of ON of.file_url = pq.gerber_url
WHERE pq.gerber_url IS NOT NULL;
*/

-- 12. 创建便捷视图：模拟原有字段结构（向后兼容）
CREATE OR REPLACE VIEW pcb_quotes_with_files AS
SELECT 
    pq.*,
    get_order_file_url(pq.id, 'gerber') as gerber_file_url,
    get_order_file_url(pq.id, 'drill') as drill_file_url,
    get_order_file_url(pq.id, 'pick_place') as pick_place_file_url,
    get_order_file_url(pq.id, 'bom') as bom_file_url,
    get_order_file_url(pq.id, 'stencil_design') as stencil_design_file_url,
    get_order_file_url(pq.id, 'dxf') as dxf_file_url,
    get_order_file_url(pq.id, 'stencil_spec') as stencil_spec_file_url,
    get_order_file_url(pq.id, 'smt_bom') as smt_bom_file_url,
    get_order_file_url(pq.id, 'smt_placement') as smt_placement_file_url,
    get_order_file_url(pq.id, 'smt_assembly_drawing') as smt_assembly_drawing_file_url,
    get_order_file_url(pq.id, 'specification') as specification_file_url,
    get_order_file_url(pq.id, 'drawing') as drawing_file_url,
    get_order_file_url(pq.id, 'document') as document_file_url,
    get_order_file_url(pq.id, 'image') as image_file_url
FROM pcb_quotes pq;

-- 13. 添加注释
COMMENT ON TABLE order_files IS '订单文件表 - 存储所有上传的文件信息';
COMMENT ON TABLE order_file_relations IS '订单文件关联表 - 建立订单与文件的多对多关系';
COMMENT ON COLUMN order_files.file_type IS '文件类型枚举';
COMMENT ON COLUMN order_files.validation_status IS '文件验证状态: pending(待验证), valid(有效), invalid(无效)';
COMMENT ON COLUMN order_files.bundle_group IS '打包组: pcb_design, stencil_design, smt_files';
COMMENT ON COLUMN order_file_relations.is_primary IS '是否为该类型的主文件（每个订单每种类型只能有一个主文件）';

-- =====================================================
-- 迁移完成
-- 
-- 新架构优势：
-- 1. 表结构规范化，避免字段冗余
-- 2. 支持无限扩展文件类型
-- 3. 支持多文件版本管理
-- 4. 支持打包文件管理
-- 5. 保持向后兼容性
-- 6. 完整的审计和权限控制
-- =====================================================

-- =====================================================
-- 多产品类型支持 - 简化实用方案
-- =====================================================
-- 
-- 支持产品类型: PCB, Stencil, SMT, 及组合类型
-- 设计原则: 在现有表基础上适度扩展，保持简单实用
--
-- =====================================================

-- 开始事务
BEGIN;

-- 1. 添加产品类型字段
ALTER TABLE pcb_quotes 
  ADD COLUMN IF NOT EXISTS product_type VARCHAR(20) DEFAULT 'pcb';

-- 2. 添加核心文件字段（精简版）
ALTER TABLE pcb_quotes 
  -- PCB设计文件 (保留现有gerber_file_url)
  ADD COLUMN IF NOT EXISTS design_files_url TEXT, -- 统一的设计文件URL (可包含Gerber、钻孔等)
  
  -- BOM文件 (PCB和SMT都需要)
  ADD COLUMN IF NOT EXISTS bom_file_url TEXT,
  
  -- SMT专用文件
  ADD COLUMN IF NOT EXISTS placement_file_url TEXT, -- 贴片位置文件
  
  -- 钢网专用文件  
  ADD COLUMN IF NOT EXISTS stencil_file_url TEXT, -- 钢网设计文件
  
  -- 通用文档
  ADD COLUMN IF NOT EXISTS specification_file_url TEXT, -- 规格文档
  ADD COLUMN IF NOT EXISTS additional_files_url TEXT; -- 其他补充文件

-- 3. 添加文件元数据字段
ALTER TABLE pcb_quotes 
  ADD COLUMN IF NOT EXISTS file_metadata JSONB DEFAULT '{}', -- 文件元数据
  ADD COLUMN IF NOT EXISTS file_upload_status VARCHAR(20) DEFAULT 'incomplete', -- incomplete, complete, validated
  ADD COLUMN IF NOT EXISTS last_file_update TIMESTAMPTZ DEFAULT NOW();

-- 4. 创建产品类型枚举约束
ALTER TABLE pcb_quotes 
  ADD CONSTRAINT check_product_type 
  CHECK (product_type IN ('pcb', 'stencil', 'smt', 'pcb_smt', 'pcb_stencil', 'smt_stencil', 'hybrid'));

-- 5. 更新现有记录的产品类型（基于现有数据推断）
UPDATE pcb_quotes 
SET product_type = CASE 
  -- 如果有钢网相关数据，设为钢网
  WHEN stencil_spec IS NOT NULL OR stencil_side IS NOT NULL THEN 'stencil'
  -- 否则默认为PCB
  ELSE 'pcb'
END
WHERE product_type = 'pcb'; -- 只更新默认值

-- 6. 创建索引
CREATE INDEX IF NOT EXISTS idx_pcb_quotes_product_type ON pcb_quotes(product_type);
CREATE INDEX IF NOT EXISTS idx_pcb_quotes_file_status ON pcb_quotes(file_upload_status);
CREATE INDEX IF NOT EXISTS idx_pcb_quotes_file_metadata ON pcb_quotes USING GIN(file_metadata);

-- 7. 创建文件验证函数
CREATE OR REPLACE FUNCTION validate_order_files_simple(
    p_order_id UUID,
    p_product_type TEXT DEFAULT 'pcb'
) RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
    order_record RECORD;
    required_files TEXT[];
    present_files TEXT[];
    missing_files TEXT[];
    result JSONB;
BEGIN
    -- 获取订单记录
    SELECT * INTO order_record FROM pcb_quotes WHERE id = p_order_id;
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object('error', 'Order not found');
    END IF;
    
    -- 根据产品类型定义必需文件
    CASE p_product_type
        WHEN 'pcb' THEN
            required_files := ARRAY['gerber_file_url'];
        WHEN 'stencil' THEN
            required_files := ARRAY['stencil_file_url'];
        WHEN 'smt' THEN
            required_files := ARRAY['bom_file_url', 'placement_file_url'];
        WHEN 'pcb_smt' THEN
            required_files := ARRAY['gerber_file_url', 'bom_file_url', 'placement_file_url'];
        WHEN 'pcb_stencil' THEN
            required_files := ARRAY['gerber_file_url', 'stencil_file_url'];
        WHEN 'smt_stencil' THEN
            required_files := ARRAY['bom_file_url', 'placement_file_url', 'stencil_file_url'];
        WHEN 'hybrid' THEN
            required_files := ARRAY['gerber_file_url', 'bom_file_url', 'placement_file_url', 'stencil_file_url'];
        ELSE
            required_files := ARRAY['gerber_file_url']; -- 默认PCB
    END CASE;
    
    -- 检查文件存在性
    FOR i IN 1..array_length(required_files, 1) LOOP
        DECLARE
            file_url TEXT;
        BEGIN
            -- 动态获取字段值
            EXECUTE format('SELECT %I FROM pcb_quotes WHERE id = $1', required_files[i])
            INTO file_url
            USING p_order_id;
            
            IF file_url IS NOT NULL AND file_url != '' THEN
                present_files := array_append(present_files, required_files[i]);
            ELSE
                missing_files := array_append(missing_files, required_files[i]);
            END IF;
        END;
    END LOOP;
    
    -- 构建结果
    result := jsonb_build_object(
        'order_id', p_order_id,
        'product_type', p_product_type,
        'is_complete', (array_length(missing_files, 1) IS NULL OR array_length(missing_files, 1) = 0),
        'required_files', COALESCE(required_files, ARRAY[]::TEXT[]),
        'present_files', COALESCE(present_files, ARRAY[]::TEXT[]),
        'missing_files', COALESCE(missing_files, ARRAY[]::TEXT[]),
        'checked_at', NOW()
    );
    
    RETURN result;
END;
$$;

-- 8. 创建触发器：自动更新文件修改时间
CREATE OR REPLACE FUNCTION update_file_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  -- 检查文件字段是否被修改
  IF (
    OLD.gerber_file_url IS DISTINCT FROM NEW.gerber_file_url OR
    OLD.design_files_url IS DISTINCT FROM NEW.design_files_url OR
    OLD.bom_file_url IS DISTINCT FROM NEW.bom_file_url OR
    OLD.placement_file_url IS DISTINCT FROM NEW.placement_file_url OR
    OLD.stencil_file_url IS DISTINCT FROM NEW.stencil_file_url OR
    OLD.specification_file_url IS DISTINCT FROM NEW.specification_file_url OR
    OLD.additional_files_url IS DISTINCT FROM NEW.additional_files_url
  ) THEN
    NEW.last_file_update = NOW();
    -- 自动调用文件验证
    NEW.file_metadata = NEW.file_metadata || 
      validate_order_files_simple(NEW.id, COALESCE(NEW.product_type, 'pcb'));
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 删除旧触发器并创建新的
DROP TRIGGER IF EXISTS trigger_update_file_timestamp ON pcb_quotes;
CREATE TRIGGER trigger_update_file_timestamp
  BEFORE UPDATE ON pcb_quotes
  FOR EACH ROW
  EXECUTE FUNCTION update_file_timestamp();

-- 9. 创建便捷视图：订单文件状态概览
CREATE OR REPLACE VIEW order_file_status_view AS
SELECT 
  id,
  user_id,
  product_type,
  
  -- 文件存在状态
  CASE WHEN gerber_file_url IS NOT NULL AND gerber_file_url != '' THEN true ELSE false END as has_gerber,
  CASE WHEN design_files_url IS NOT NULL AND design_files_url != '' THEN true ELSE false END as has_design_files,
  CASE WHEN bom_file_url IS NOT NULL AND bom_file_url != '' THEN true ELSE false END as has_bom,
  CASE WHEN placement_file_url IS NOT NULL AND placement_file_url != '' THEN true ELSE false END as has_placement,
  CASE WHEN stencil_file_url IS NOT NULL AND stencil_file_url != '' THEN true ELSE false END as has_stencil,
  CASE WHEN specification_file_url IS NOT NULL AND specification_file_url != '' THEN true ELSE false END as has_specification,
  
  -- 文件完整性检查
  validate_order_files_simple(id, COALESCE(product_type, 'pcb')) as file_completeness,
  
  file_upload_status,
  last_file_update,
  created_at,
  updated_at
FROM pcb_quotes;

-- 10. 添加字段注释
COMMENT ON COLUMN pcb_quotes.product_type IS '产品类型: pcb, stencil, smt, pcb_smt, pcb_stencil, smt_stencil, hybrid';
COMMENT ON COLUMN pcb_quotes.design_files_url IS '设计文件URL (可包含Gerber、钻孔等)';
COMMENT ON COLUMN pcb_quotes.bom_file_url IS '物料清单文件URL';
COMMENT ON COLUMN pcb_quotes.placement_file_url IS 'SMT贴片位置文件URL';
COMMENT ON COLUMN pcb_quotes.stencil_file_url IS '钢网设计文件URL';
COMMENT ON COLUMN pcb_quotes.specification_file_url IS '规格文档URL';
COMMENT ON COLUMN pcb_quotes.additional_files_url IS '其他补充文件URL';
COMMENT ON COLUMN pcb_quotes.file_metadata IS '文件元数据JSON (文件大小、类型、验证结果等)';
COMMENT ON COLUMN pcb_quotes.file_upload_status IS '文件上传状态: incomplete, complete, validated';

-- 11. 更新现有订单的文件验证状态
UPDATE pcb_quotes 
SET file_metadata = validate_order_files_simple(id, COALESCE(product_type, 'pcb')),
    file_upload_status = CASE 
      WHEN gerber_file_url IS NOT NULL THEN 'complete' 
      ELSE 'incomplete' 
    END
WHERE file_metadata = '{}' OR file_metadata IS NULL;

-- 提交事务
COMMIT;

-- =====================================================
-- 简化方案总结:
-- 
-- 新增字段 (6个):
-- - product_type: 产品类型
-- - design_files_url: 统一设计文件
-- - bom_file_url: BOM文件  
-- - placement_file_url: SMT贴片文件
-- - stencil_file_url: 钢网文件
-- - specification_file_url: 规格文档
-- - additional_files_url: 其他文件
-- 
-- 元数据字段 (3个):
-- - file_metadata: JSONB元数据
-- - file_upload_status: 上传状态
-- - last_file_update: 更新时间
--
-- 优势:
-- 1. 字段数量合理 (9个新字段 vs 之前的14个)
-- 2. 支持所有需要的产品类型组合
-- 3. 通过JSONB存储扩展信息
-- 4. 自动文件验证和状态更新
-- 5. 保持向后兼容
-- ===================================================== 