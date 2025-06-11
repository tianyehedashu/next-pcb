-- 修复 admin_orders 表结构的脚本
-- 确保所有必要的字段都存在，并且类型正确

\echo '🔧 开始修复 admin_orders 表结构...'

-- 1. 检查并创建表（如果不存在）
CREATE TABLE IF NOT EXISTS public.admin_orders (
  id BIGSERIAL PRIMARY KEY,
  user_order_id BIGINT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

\echo '✅ 确保基础表结构存在'

-- 2. 添加缺失的字段（如果不存在）
DO $$
BEGIN
  -- 状态字段
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'admin_orders' AND column_name = 'status') THEN
    ALTER TABLE public.admin_orders ADD COLUMN status VARCHAR(50) DEFAULT 'created';
    RAISE NOTICE '✅ 添加 status 字段';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'admin_orders' AND column_name = 'payment_status') THEN
    ALTER TABLE public.admin_orders ADD COLUMN payment_status VARCHAR(50) DEFAULT 'unpaid';
    RAISE NOTICE '✅ 添加 payment_status 字段';
  END IF;

  -- 价格字段
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'admin_orders' AND column_name = 'pcb_price') THEN
    ALTER TABLE public.admin_orders ADD COLUMN pcb_price DECIMAL(10,2);
    RAISE NOTICE '✅ 添加 pcb_price 字段';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'admin_orders' AND column_name = 'admin_price') THEN
    ALTER TABLE public.admin_orders ADD COLUMN admin_price DECIMAL(10,2);
    RAISE NOTICE '✅ 添加 admin_price 字段';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'admin_orders' AND column_name = 'cny_price') THEN
    ALTER TABLE public.admin_orders ADD COLUMN cny_price DECIMAL(10,2);
    RAISE NOTICE '✅ 添加 cny_price 字段';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'admin_orders' AND column_name = 'currency') THEN
    ALTER TABLE public.admin_orders ADD COLUMN currency VARCHAR(10) DEFAULT 'CNY';
    RAISE NOTICE '✅ 添加 currency 字段';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'admin_orders' AND column_name = 'exchange_rate') THEN
    ALTER TABLE public.admin_orders ADD COLUMN exchange_rate DECIMAL(10,4) DEFAULT 7.2;
    RAISE NOTICE '✅ 添加 exchange_rate 字段';
  END IF;

  -- 费用字段
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'admin_orders' AND column_name = 'ship_price') THEN
    ALTER TABLE public.admin_orders ADD COLUMN ship_price DECIMAL(10,2);
    RAISE NOTICE '✅ 添加 ship_price 字段';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'admin_orders' AND column_name = 'custom_duty') THEN
    ALTER TABLE public.admin_orders ADD COLUMN custom_duty DECIMAL(10,2);
    RAISE NOTICE '✅ 添加 custom_duty 字段';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'admin_orders' AND column_name = 'coupon') THEN
    ALTER TABLE public.admin_orders ADD COLUMN coupon DECIMAL(10,2) DEFAULT 0;
    RAISE NOTICE '✅ 添加 coupon 字段';
  END IF;

  -- 时间字段
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'admin_orders' AND column_name = 'due_date') THEN
    ALTER TABLE public.admin_orders ADD COLUMN due_date DATE;
    RAISE NOTICE '✅ 添加 due_date 字段';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'admin_orders' AND column_name = 'pay_time') THEN
    ALTER TABLE public.admin_orders ADD COLUMN pay_time TIMESTAMP WITH TIME ZONE;
    RAISE NOTICE '✅ 添加 pay_time 字段';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'admin_orders' AND column_name = 'production_days') THEN
    ALTER TABLE public.admin_orders ADD COLUMN production_days INTEGER;
    RAISE NOTICE '✅ 添加 production_days 字段';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'admin_orders' AND column_name = 'delivery_date') THEN
    ALTER TABLE public.admin_orders ADD COLUMN delivery_date DATE;
    RAISE NOTICE '✅ 添加 delivery_date 字段';
  END IF;

  -- 备注字段（重要！）
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'admin_orders' AND column_name = 'admin_note') THEN
    ALTER TABLE public.admin_orders ADD COLUMN admin_note TEXT;
    RAISE NOTICE '✅ 添加 admin_note 字段 (TEXT类型)';
  END IF;

  -- 加价项字段
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'admin_orders' AND column_name = 'surcharges') THEN
    ALTER TABLE public.admin_orders ADD COLUMN surcharges JSONB DEFAULT '[]'::jsonb;
    RAISE NOTICE '✅ 添加 surcharges 字段 (JSONB类型)';
  END IF;
END
$$;

\echo '✅ 所有字段检查完成'

-- 3. 修复可能的数据类型问题
DO $$
BEGIN
  -- 检查 admin_note 字段是否为正确的 TEXT 类型
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'admin_orders' 
    AND column_name = 'admin_note' 
    AND data_type != 'text'
  ) THEN
    -- 如果类型不对，先备份数据，然后修改类型
    RAISE NOTICE '🔧 修复 admin_note 字段类型...';
    
    -- 添加临时列
    ALTER TABLE public.admin_orders ADD COLUMN admin_note_temp TEXT;
    
    -- 复制数据（处理可能的数组类型）
    UPDATE public.admin_orders 
    SET admin_note_temp = CASE 
      WHEN admin_note::text = '[]' OR admin_note::text = 'null' THEN ''
      WHEN admin_note::text LIKE '[%]' THEN 
        REPLACE(REPLACE(REPLACE(admin_note::text, '["', ''), '"]', ''), '","', E'\n')
      ELSE admin_note::text
    END;
    
    -- 删除旧列
    ALTER TABLE public.admin_orders DROP COLUMN admin_note;
    
    -- 重命名新列
    ALTER TABLE public.admin_orders RENAME COLUMN admin_note_temp TO admin_note;
    
    RAISE NOTICE '✅ admin_note 字段类型已修复为 TEXT';
  END IF;

  -- 检查 surcharges 字段类型
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'admin_orders' 
    AND column_name = 'surcharges' 
    AND data_type != 'jsonb'
  ) THEN
    RAISE NOTICE '🔧 修复 surcharges 字段类型...';
    ALTER TABLE public.admin_orders ALTER COLUMN surcharges TYPE JSONB USING surcharges::jsonb;
    ALTER TABLE public.admin_orders ALTER COLUMN surcharges SET DEFAULT '[]'::jsonb;
    RAISE NOTICE '✅ surcharges 字段类型已修复为 JSONB';
  END IF;
END
$$;

\echo '✅ 数据类型修复完成'

-- 4. 创建必要的索引
CREATE INDEX IF NOT EXISTS idx_admin_orders_user_order_id ON public.admin_orders(user_order_id);
CREATE INDEX IF NOT EXISTS idx_admin_orders_status ON public.admin_orders(status);
CREATE INDEX IF NOT EXISTS idx_admin_orders_created_at ON public.admin_orders(created_at);

\echo '✅ 索引创建完成'

-- 5. 添加约束
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'unique_user_order_id' 
    AND table_name = 'admin_orders'
  ) THEN
    ALTER TABLE public.admin_orders ADD CONSTRAINT unique_user_order_id UNIQUE (user_order_id);
    RAISE NOTICE '✅ 添加唯一约束 unique_user_order_id';
  END IF;
END
$$;

-- 6. 创建更新触发器
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_admin_orders_updated_at ON admin_orders;
CREATE TRIGGER update_admin_orders_updated_at 
    BEFORE UPDATE ON admin_orders 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

\echo '✅ 更新触发器创建完成'

-- 7. 设置RLS权限
ALTER TABLE public.admin_orders ENABLE ROW LEVEL SECURITY;

-- 删除现有策略并重新创建
DROP POLICY IF EXISTS "Admins can manage all admin orders" ON public.admin_orders;

CREATE POLICY "Admins can manage all admin orders"
ON public.admin_orders
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'super_admin')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'super_admin')
  )
);

\echo '✅ RLS权限设置完成'

-- 8. 显示最终表结构
\echo '📋 最终表结构:'
\d public.admin_orders

\echo '🎉 admin_orders 表结构修复完成！'

-- 9. 测试数据完整性
SELECT 
  COUNT(*) as total_records,
  COUNT(admin_note) as records_with_notes,
  COUNT(surcharges) as records_with_surcharges
FROM public.admin_orders;

\echo '📊 数据完整性检查完成' 