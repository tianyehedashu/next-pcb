-- 为 admin_orders 表添加缺失的退款相关字段
-- 基于实际表结构分析，只添加确实缺失的字段
-- 当前已存在：refund_status, requested_refund_amount, approved_refund_amount, payment_status, payment_method

\echo '🔧 开始为 admin_orders 表添加缺失的退款相关字段...'

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
  -- 检查已存在的字段并确认
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'admin_orders' AND column_name = 'refund_status') THEN
    RAISE NOTICE '✅ refund_status 字段已存在';
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'admin_orders' AND column_name = 'requested_refund_amount') THEN
    RAISE NOTICE '✅ requested_refund_amount 字段已存在';
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'admin_orders' AND column_name = 'approved_refund_amount') THEN
    RAISE NOTICE '✅ approved_refund_amount 字段已存在';
  END IF;

  -- 添加缺失的退款时间字段
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'admin_orders' AND column_name = 'refund_request_at') THEN
    ALTER TABLE public.admin_orders ADD COLUMN refund_request_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;
    RAISE NOTICE '✅ 添加 refund_request_at 字段';
  ELSE
    RAISE NOTICE '⚠️ refund_request_at 字段已存在，跳过创建';
  END IF;

  -- 添加实际退款金额字段
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'admin_orders' AND column_name = 'actual_refund_amount') THEN
    ALTER TABLE public.admin_orders ADD COLUMN actual_refund_amount NUMERIC DEFAULT NULL;
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

  -- 添加退款完成时间字段
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
    ALTER TABLE public.admin_orders ADD COLUMN stripe_refund_id TEXT DEFAULT NULL;
    RAISE NOTICE '✅ 添加 stripe_refund_id 字段';
  ELSE
    RAISE NOTICE '⚠️ stripe_refund_id 字段已存在，跳过创建';
  END IF;

  -- 注意：复用现有的 status 字段进行退款策略判断，不需要额外的 order_status 字段
  -- 现有 status 字段包含：reviewed, paid, in_production, shipped, delivered, completed 等
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'admin_orders' AND column_name = 'status') THEN
    RAISE NOTICE '✅ 复用现有 status 字段进行退款策略判断';
  ELSE
    RAISE NOTICE '⚠️ status 字段不存在，请检查表结构';
  END IF;

  -- 确认现有payment_status字段支持refunded状态
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'admin_orders' AND column_name = 'payment_status') THEN
    RAISE NOTICE '✅ 确认 payment_status 字段存在（当前类型: VARCHAR(32)）';
  END IF;
END
$$;

-- 创建缺失的退款相关索引
CREATE INDEX IF NOT EXISTS idx_admin_orders_refund_status ON public.admin_orders(refund_status);
CREATE INDEX IF NOT EXISTS idx_admin_orders_refund_request_at ON public.admin_orders(refund_request_at);
-- 注意：status 字段索引应该已存在，如果没有则创建
CREATE INDEX IF NOT EXISTS idx_admin_orders_status ON public.admin_orders(status);
CREATE INDEX IF NOT EXISTS idx_admin_orders_stripe_refund_id ON public.admin_orders(stripe_refund_id);

-- 注意：payment_status 和 user_order_id 索引已存在，跳过创建

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
-- 注意：复用现有的 status 字段注释，该字段已包含完整的订单状态流程
-- COMMENT ON COLUMN public.admin_orders.status IS '管理员订单状态: reviewed, paid, in_production, shipped, delivered, completed 等 - 同时用于退款策略判断';
COMMENT ON COLUMN public.admin_orders.payment_status IS '支付状态: unpaid(未支付), paid(已支付), refunded(已退款) 等';

\echo '✅ 退款相关字段补充完成！'

-- 显示当前 admin_orders 表结构中的退款相关字段
\echo '📋 当前 admin_orders 表的退款相关字段：'
SELECT 
    column_name,
    data_type,
    character_maximum_length,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'admin_orders' 
  AND table_schema = 'public'
  AND (column_name LIKE '%refund%' OR column_name IN ('payment_status', 'status', 'stripe_refund_id', 'payment_method'))
ORDER BY ordinal_position; 