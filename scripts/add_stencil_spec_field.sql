-- 为pcb_quotes表添加灵活的产品类型支持
-- 支持PCB、钢网、SMT组装以及未来的任意组合

-- 1. 添加产品类型数组字段（支持多产品类型）
ALTER TABLE pcb_quotes 
ADD COLUMN IF NOT EXISTS product_types TEXT[] DEFAULT ARRAY['pcb'];

-- 2. 添加产品类型枚举检查（单一产品类型，保持向后兼容）
ALTER TABLE pcb_quotes 
ADD COLUMN IF NOT EXISTS product_type TEXT DEFAULT 'pcb' CHECK (product_type IN ('pcb', 'stencil', 'smt', 'combo'));

-- 3. 添加各产品规格字段
ALTER TABLE pcb_quotes 
ADD COLUMN IF NOT EXISTS stencil_spec JSONB;

-- 4. 添加SMT组装规格字段（预留）
ALTER TABLE pcb_quotes 
ADD COLUMN IF NOT EXISTS smt_spec JSONB;

-- 5. 添加组装/组合配置字段（重命名combo_spec为assembly_spec）
ALTER TABLE pcb_quotes 
ADD COLUMN IF NOT EXISTS assembly_spec JSONB;

-- 6. 为新字段添加索引（提高查询性能）
CREATE INDEX IF NOT EXISTS idx_pcb_quotes_product_types ON pcb_quotes USING GIN (product_types);
CREATE INDEX IF NOT EXISTS idx_pcb_quotes_product_type ON pcb_quotes(product_type);
CREATE INDEX IF NOT EXISTS idx_pcb_quotes_stencil_spec ON pcb_quotes USING GIN (stencil_spec);
CREATE INDEX IF NOT EXISTS idx_pcb_quotes_smt_spec ON pcb_quotes USING GIN (smt_spec);
CREATE INDEX IF NOT EXISTS idx_pcb_quotes_assembly_spec ON pcb_quotes USING GIN (assembly_spec);

-- 7. 添加注释说明
COMMENT ON COLUMN pcb_quotes.product_types IS '产品类型数组: 支持多个产品类型组合，如["pcb", "stencil", "smt"]';
COMMENT ON COLUMN pcb_quotes.product_type IS '主要产品类型: pcb=PCB, stencil=钢网, smt=SMT组装, combo=组合订单';
COMMENT ON COLUMN pcb_quotes.pcb_spec IS 'PCB产品规格（仅存储PCB相关字段）';
COMMENT ON COLUMN pcb_quotes.stencil_spec IS '钢网产品规格（仅存储钢网相关字段）';
COMMENT ON COLUMN pcb_quotes.smt_spec IS 'SMT组装规格（SMT贴片组装服务规格）';
COMMENT ON COLUMN pcb_quotes.assembly_spec IS '组装/组合配置（多产品组合的协调配置，如交期同步、质量要求等）';

-- 8. 数据迁移：设置product_types数组
UPDATE pcb_quotes 
SET product_types = CASE 
  WHEN product_type = 'stencil' THEN ARRAY['stencil']
  WHEN product_type = 'pcb' THEN ARRAY['pcb']
  WHEN product_type = 'combo' THEN ARRAY['pcb', 'stencil']  -- 假设combo是PCB+钢网
  ELSE ARRAY['pcb']
END
WHERE product_types IS NULL OR product_types = ARRAY[]::TEXT[];

-- 9. 检测现有数据中的钢网订单并迁移
UPDATE pcb_quotes 
SET 
  product_type = 'stencil',
  product_types = ARRAY['stencil'],
  stencil_spec = jsonb_build_object(
    'productType', 'stencil',
    'borderType', pcb_spec->>'borderType',
    'stencilType', pcb_spec->>'stencilType', 
    'size', pcb_spec->>'size',
    'stencilSide', pcb_spec->>'stencilSide',
    'quantity', (pcb_spec->>'quantity')::integer,
    'thickness', (pcb_spec->>'thickness')::numeric,
    'existingFiducials', pcb_spec->>'existingFiducials',
    'electropolishing', pcb_spec->>'electropolishing',
    'engineeringRequirements', pcb_spec->>'engineeringRequirements',
    'addPoNo', pcb_spec->>'addPoNo',
    'specialRequests', pcb_spec->>'specialRequests',
    'shippingCostEstimation', pcb_spec->'shippingCostEstimation',
    'customsNote', pcb_spec->>'customsNote',
    'userNote', pcb_spec->>'userNote',
    'detectedAt', pcb_spec->>'detectedAt'
  ),
  -- 清理pcb_spec中的钢网字段，只保留通用字段
  pcb_spec = jsonb_build_object(
    'gerberUrl', pcb_spec->>'gerberUrl',
    'shippingCostEstimation', pcb_spec->'shippingCostEstimation'
  )
WHERE pcb_spec->>'productType' = 'stencil' 
   OR pcb_spec->>'borderType' IS NOT NULL
   OR pcb_spec->>'stencilType' IS NOT NULL;

-- 10. 清理PCB订单中的钢网字段残留
UPDATE pcb_quotes 
SET pcb_spec = pcb_spec 
  - 'borderType' 
  - 'stencilType' 
  - 'stencilSide' 
  - 'stencilSize'
  - 'stencilThickness'
  - 'stencilMaterial'
  - 'stencilProcess'
  - 'frameType'
  - 'frameSize'
  - 'tensionMesh'
  - 'printingMethod'
  - 'surfaceTreatment'
  - 'fiducialMarks'
  - 'existingFiducials'
  - 'electropolishing'
  - 'engineeringRequirements'
  - 'addPoNo'
WHERE 'pcb' = ANY(product_types);

-- 11. 验证数据迁移结果
SELECT 
  product_type,
  product_types,
  COUNT(*) as count,
  -- 检查字段分布
  COUNT(CASE WHEN pcb_spec IS NOT NULL THEN 1 END) as has_pcb_spec,
  COUNT(CASE WHEN stencil_spec IS NOT NULL THEN 1 END) as has_stencil_spec,
  COUNT(CASE WHEN smt_spec IS NOT NULL THEN 1 END) as has_smt_spec,
  COUNT(CASE WHEN assembly_spec IS NOT NULL THEN 1 END) as has_assembly_spec
FROM pcb_quotes 
GROUP BY product_type, product_types
ORDER BY product_type;

-- 12. 显示迁移后的示例数据
SELECT 
  id,
  product_type,
  product_types,
  CASE 
    WHEN 'pcb' = ANY(product_types) THEN jsonb_pretty(pcb_spec)
    ELSE 'no pcb spec'
  END as pcb_spec_preview,
  CASE 
    WHEN 'stencil' = ANY(product_types) THEN jsonb_pretty(stencil_spec) 
    ELSE 'no stencil spec'
  END as stencil_spec_preview
FROM pcb_quotes 
ORDER BY created_at DESC 
LIMIT 5; 