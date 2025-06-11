-- 创建 admin_orders 表（如果不存在）
-- 这个表用于存储管理员对用户订单的管理信息

CREATE TABLE IF NOT EXISTS public.admin_orders (
  id BIGSERIAL PRIMARY KEY,
  user_order_id BIGINT NOT NULL, -- 关联的用户订单ID（可能是pcb_quotes.id或orders.id）
  status VARCHAR(50) DEFAULT 'created', -- 管理员处理状态
  payment_status VARCHAR(50) DEFAULT 'unpaid', -- 支付状态
  
  -- 价格信息
  pcb_price DECIMAL(10,2), -- PCB价格
  admin_price DECIMAL(10,2), -- 管理员价格（根据币种显示）
  cny_price DECIMAL(10,2), -- 人民币价格
  currency VARCHAR(10) DEFAULT 'CNY', -- 币种
  exchange_rate DECIMAL(10,4) DEFAULT 7.2, -- 汇率
  
  -- 费用明细
  ship_price DECIMAL(10,2), -- 运费
  custom_duty DECIMAL(10,2), -- 关税
  coupon DECIMAL(10,2) DEFAULT 0, -- 优惠券金额
  
  -- 时间信息
  due_date DATE, -- 到期日期
  pay_time TIMESTAMP WITH TIME ZONE, -- 支付时间
  production_days INTEGER, -- 生产天数
  delivery_date DATE, -- 预计交付日期
  
  -- 备注和额外信息
  admin_note TEXT, -- 管理员备注（字符串类型）
  surcharges JSONB DEFAULT '[]'::jsonb, -- 加价项（JSON数组）
  
  -- 时间戳
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_admin_orders_user_order_id ON public.admin_orders(user_order_id);
CREATE INDEX IF NOT EXISTS idx_admin_orders_status ON public.admin_orders(status);
CREATE INDEX IF NOT EXISTS idx_admin_orders_created_at ON public.admin_orders(created_at);

-- 添加约束确保一对一关系
ALTER TABLE public.admin_orders 
ADD CONSTRAINT IF NOT EXISTS unique_user_order_id UNIQUE (user_order_id);

-- 添加更新时间触发器
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER IF NOT EXISTS update_admin_orders_updated_at 
    BEFORE UPDATE ON admin_orders 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- 启用行级安全
ALTER TABLE public.admin_orders ENABLE ROW LEVEL SECURITY;

-- 删除现有策略（如果存在）
DROP POLICY IF EXISTS "Admins can manage all admin orders" ON public.admin_orders;

-- 创建管理员权限策略
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

-- 添加注释
COMMENT ON TABLE public.admin_orders IS '管理员订单管理表，用于存储管理员对用户订单的处理信息';
COMMENT ON COLUMN public.admin_orders.user_order_id IS '关联的用户订单ID';
COMMENT ON COLUMN public.admin_orders.admin_note IS '管理员备注，支持多行文本';
COMMENT ON COLUMN public.admin_orders.surcharges IS '加价项明细，存储为JSON数组，格式: [{"name": "加急费", "amount": 100}]'; 