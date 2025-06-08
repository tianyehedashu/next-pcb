-- 为管理员订单表添加 surcharges 字段（加价明细，jsonb 数组）
ALTER TABLE admin_orders ADD COLUMN IF NOT EXISTS surcharges jsonb DEFAULT '[]'::jsonb; 