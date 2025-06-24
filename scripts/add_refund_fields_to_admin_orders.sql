-- 为 admin_orders 表添加退款相关字段
-- 修复退款功能所需的数据库结构
-- 注意：此脚本会检查现有字段，避免重复创建

\echo '🔧 开始为 admin_orders 表添加退款相关字段...'

-- 首先检查表是否存在
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'admin_orders') THEN
    RAISE EXCEPTION 'admin_orders 表不存在！请先运行基础表创建脚本。';
  END IF;
END
$$;

DO $$
BEGIN
  -- 添加退款状态字段（扩展现有的 payment_status）
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'admin_orders' AND column_name = 'refund_status') THEN
    ALTER TABLE public.admin_orders ADD COLUMN refund_status VARCHAR(50) DEFAULT NULL;
    RAISE NOTICE '✅ 添加 refund_status 字段';
  ELSE
    RAISE NOTICE '⚠️ refund_status 字段已存在，跳过创建';
  END IF;

  -- 添加退款请求时间字段
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'admin_orders' AND column_name = 'refund_request_at') THEN
    ALTER TABLE public.admin_orders ADD COLUMN refund_request_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;
    RAISE NOTICE '✅ 添加 refund_request_at 字段';
  ELSE
    RAISE NOTICE '⚠️ refund_request_at 字段已存在，跳过创建';
  END IF;

  -- 添加请求退款金额字段
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'admin_orders' AND column_name = 'requested_refund_amount') THEN
    ALTER TABLE public.admin_orders ADD COLUMN requested_refund_amount DECIMAL(10,2) DEFAULT NULL;
    RAISE NOTICE '✅ 添加 requested_refund_amount 字段';
  ELSE
    RAISE NOTICE '⚠️ requested_refund_amount 字段已存在，跳过创建';
  END IF;

  -- 添加批准退款金额字段
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'admin_orders' AND column_name = 'approved_refund_amount') THEN
    ALTER TABLE public.admin_orders ADD COLUMN approved_refund_amount DECIMAL(10,2) DEFAULT NULL;
    RAISE NOTICE '✅ 添加 approved_refund_amount 字段';
  ELSE
    RAISE NOTICE '⚠️ approved_refund_amount 字段已存在，跳过创建';
  END IF;

  -- 添加实际退款金额字段
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'admin_orders' AND column_name = 'actual_refund_amount') THEN
    ALTER TABLE public.admin_orders ADD COLUMN actual_refund_amount DECIMAL(10,2) DEFAULT NULL;
    RAISE NOTICE '✅ 添加 actual_refund_amount 字段';
  ELSE
    RAISE NOTICE '⚠️ actual_refund_amount 字段已存在，跳过创建';
  END IF;

  -- 添加退款处理时间字段
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'admin_orders' AND column_name = 'refund_processed_at') THEN
    ALTER TABLE public.admin_orders ADD COLUMN refund_processed_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;
    RAISE NOTICE '✅ 添加 refund_processed_at 字段';
  ELSE
    RAISE NOTICE '⚠️ refund_processed_at 字段已存在，跳过创建';
  END IF;

  -- 添加用户确认退款时间字段
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'admin_orders' AND column_name = 'user_refund_confirmation_at') THEN
    ALTER TABLE public.admin_orders ADD COLUMN user_refund_confirmation_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;
    RAISE NOTICE '✅ 添加 user_refund_confirmation_at 字段';
  ELSE
    RAISE NOTICE '⚠️ user_refund_confirmation_at 字段已存在，跳过创建';
  END IF;

  -- 添加退款完成时间字段（不同于处理时间）
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'admin_orders' AND column_name = 'refunded_at') THEN
    ALTER TABLE public.admin_orders ADD COLUMN refunded_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;
    RAISE NOTICE '✅ 添加 refunded_at 字段';
  ELSE
    RAISE NOTICE '⚠️ refunded_at 字段已存在，跳过创建';
  END IF;

  -- 添加退款备注字段
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'admin_orders' AND column_name = 'refund_note') THEN
    ALTER TABLE public.admin_orders ADD COLUMN refund_note TEXT DEFAULT NULL;
    RAISE NOTICE '✅ 添加 refund_note 字段';
  ELSE
    RAISE NOTICE '⚠️ refund_note 字段已存在，跳过创建';
  END IF;

  -- 添加退款原因字段
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'admin_orders' AND column_name = 'refund_reason') THEN
    ALTER TABLE public.admin_orders ADD COLUMN refund_reason TEXT DEFAULT NULL;
    RAISE NOTICE '✅ 添加 refund_reason 字段';
  ELSE
    RAISE NOTICE '⚠️ refund_reason 字段已存在，跳过创建';
  END IF;

  -- 添加Stripe退款ID字段
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'admin_orders' AND column_name = 'stripe_refund_id') THEN
    ALTER TABLE public.admin_orders ADD COLUMN stripe_refund_id VARCHAR(255) DEFAULT NULL;
    RAISE NOTICE '✅ 添加 stripe_refund_id 字段';
  ELSE
    RAISE NOTICE '⚠️ stripe_refund_id 字段已存在，跳过创建';
  END IF;

  -- 检查并添加订单状态字段（如果不存在）
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'admin_orders' AND column_name = 'order_status') THEN
    ALTER TABLE public.admin_orders ADD COLUMN order_status VARCHAR(50) DEFAULT 'paid';
    RAISE NOTICE '✅ 添加 order_status 字段';
  ELSE
    RAISE NOTICE '⚠️ order_status 字段已存在，跳过创建';
  END IF;

  -- 检查现有的 payment_status 字段，确保支持 refunded 状态
  -- 这个字段应该已经存在，我们只是确认一下
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'admin_orders' AND column_name = 'payment_status') THEN
    RAISE NOTICE '✅ 确认 payment_status 字段存在（应该支持 refunded 状态）';
  ELSE
    ALTER TABLE public.admin_orders ADD COLUMN payment_status VARCHAR(50) DEFAULT 'unpaid';
    RAISE NOTICE '✅ 添加 payment_status 字段';
  END IF;
END
$$;

-- 创建退款相关的索引
CREATE INDEX IF NOT EXISTS idx_admin_orders_refund_status ON public.admin_orders(refund_status);
CREATE INDEX IF NOT EXISTS idx_admin_orders_refund_request_at ON public.admin_orders(refund_request_at);
CREATE INDEX IF NOT EXISTS idx_admin_orders_payment_status ON public.admin_orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_admin_orders_order_status ON public.admin_orders(order_status);
CREATE INDEX IF NOT EXISTS idx_admin_orders_stripe_refund_id ON public.admin_orders(stripe_refund_id);

-- 添加字段注释
COMMENT ON COLUMN public.admin_orders.refund_status IS '退款状态: null(无退款), requested(已请求), pending_confirmation(等待用户确认), approved(已批准), rejected(已拒绝), processing(处理中), processed(已处理完成)';
COMMENT ON COLUMN public.admin_orders.refund_request_at IS '退款请求时间';
COMMENT ON COLUMN public.admin_orders.requested_refund_amount IS '用户请求的退款金额';
COMMENT ON COLUMN public.admin_orders.approved_refund_amount IS '管理员批准的退款金额';
COMMENT ON COLUMN public.admin_orders.actual_refund_amount IS '实际退款金额（与Stripe一致）';
COMMENT ON COLUMN public.admin_orders.refund_processed_at IS '退款处理开始时间';
COMMENT ON COLUMN public.admin_orders.user_refund_confirmation_at IS '用户确认退款时间';
COMMENT ON COLUMN public.admin_orders.refunded_at IS '退款完成时间';
COMMENT ON COLUMN public.admin_orders.refund_note IS '退款相关备注';
COMMENT ON COLUMN public.admin_orders.refund_reason IS '退款原因';
COMMENT ON COLUMN public.admin_orders.stripe_refund_id IS 'Stripe退款ID，用于跟踪退款状态';
COMMENT ON COLUMN public.admin_orders.order_status IS '订单状态: paid(已支付), in_production(生产中), shipped(已发货), completed(已完成)';
COMMENT ON COLUMN public.admin_orders.payment_status IS '支付状态: unpaid(未支付), pending(待处理), paid(已支付), failed(失败), cancelled(已取消), refunded(已退款)';

\echo '✅ 退款相关字段添加完成！'

-- 显示当前 admin_orders 表结构中的退款相关字段
\echo '📋 当前 admin_orders 表的退款相关字段：'
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'admin_orders' 
  AND table_schema = 'public'
  AND (column_name LIKE '%refund%' OR column_name IN ('payment_status', 'order_status', 'stripe_refund_id'))
ORDER BY ordinal_position; 