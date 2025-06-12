-- 为 admin_orders 表添加支付相关字段
-- 支付状态应该由管理员控制，放在 admin_orders 表中

-- 添加支付相关字段到 admin_orders 表
ALTER TABLE public.admin_orders 
ADD COLUMN IF NOT EXISTS payment_method VARCHAR(50) DEFAULT NULL;

ALTER TABLE public.admin_orders 
ADD COLUMN IF NOT EXISTS payment_intent_id VARCHAR(255) DEFAULT NULL;

ALTER TABLE public.admin_orders 
ADD COLUMN IF NOT EXISTS paid_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- 添加订单状态字段，用于跟踪整个订单流程
ALTER TABLE public.admin_orders 
ADD COLUMN IF NOT EXISTS order_status VARCHAR(50) DEFAULT 'pending_review';

-- 添加索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_admin_orders_payment_status ON admin_orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_admin_orders_payment_intent_id ON admin_orders(payment_intent_id);
CREATE INDEX IF NOT EXISTS idx_admin_orders_order_status ON admin_orders(order_status);

-- 添加注释
COMMENT ON COLUMN admin_orders.payment_status IS 'Payment status: unpaid, pending, paid, failed, cancelled, refunded - controlled by admin';
COMMENT ON COLUMN admin_orders.payment_method IS 'Payment method used: stripe, paypal, bank_transfer, etc.';
COMMENT ON COLUMN admin_orders.payment_intent_id IS 'Stripe payment intent ID for tracking';
COMMENT ON COLUMN admin_orders.paid_at IS 'Timestamp when payment was completed';
COMMENT ON COLUMN admin_orders.order_status IS 'Overall order status: pending_review, quoted, payment_ready, paid, in_production, shipped, completed, cancelled'; 