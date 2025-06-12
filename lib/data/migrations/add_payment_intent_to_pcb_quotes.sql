-- 为 pcb_quotes 表添加 payment_intent_id 字段
-- 这个字段存储 Stripe payment intent 的 ID，用于跟踪用户的支付状态

ALTER TABLE public.pcb_quotes 
ADD COLUMN IF NOT EXISTS payment_intent_id VARCHAR(255) DEFAULT NULL;

-- 添加索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_pcb_quotes_payment_intent_id 
ON public.pcb_quotes(payment_intent_id);

-- 添加注释
COMMENT ON COLUMN public.pcb_quotes.payment_intent_id 
IS 'Stripe payment intent ID for tracking user payments';

-- 确保字段唯一性（一个payment intent只能对应一个订单）
ALTER TABLE public.pcb_quotes 
ADD CONSTRAINT IF NOT EXISTS unique_payment_intent_id 
UNIQUE (payment_intent_id); 