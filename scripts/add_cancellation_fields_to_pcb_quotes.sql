-- 为 pcb_quotes 表添加订单取消相关字段
-- 文件: add_cancellation_fields_to_pcb_quotes.sql

DO $$
DECLARE
    column_exists BOOLEAN;
BEGIN
    -- 检查并添加 cancelled_at 字段
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'pcb_quotes' AND column_name = 'cancelled_at'
    ) INTO column_exists;
    
    IF NOT column_exists THEN
        ALTER TABLE public.pcb_quotes ADD COLUMN cancelled_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;
        RAISE NOTICE '✅ 添加 cancelled_at 字段';
    ELSE
        RAISE NOTICE '⚠️ cancelled_at 字段已存在，跳过创建';
    END IF;

    -- 检查并添加 cancellation_reason 字段
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'pcb_quotes' AND column_name = 'cancellation_reason'
    ) INTO column_exists;
    
    IF NOT column_exists THEN
        ALTER TABLE public.pcb_quotes ADD COLUMN cancellation_reason TEXT DEFAULT NULL;
        RAISE NOTICE '✅ 添加 cancellation_reason 字段';
    ELSE
        RAISE NOTICE '⚠️ cancellation_reason 字段已存在，跳过创建';
    END IF;

    -- 检查并添加 cancelled_by 字段
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'pcb_quotes' AND column_name = 'cancelled_by'
    ) INTO column_exists;
    
    IF NOT column_exists THEN
        ALTER TABLE public.pcb_quotes ADD COLUMN cancelled_by VARCHAR(50) DEFAULT NULL;
        RAISE NOTICE '✅ 添加 cancelled_by 字段';
    ELSE
        RAISE NOTICE '⚠️ cancelled_by 字段已存在，跳过创建';
    END IF;

    -- 检查并添加 can_be_uncancelled 字段
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'pcb_quotes' AND column_name = 'can_be_uncancelled'
    ) INTO column_exists;
    
    IF NOT column_exists THEN
        ALTER TABLE public.pcb_quotes ADD COLUMN can_be_uncancelled BOOLEAN DEFAULT FALSE;
        RAISE NOTICE '✅ 添加 can_be_uncancelled 字段';
    ELSE
        RAISE NOTICE '⚠️ can_be_uncancelled 字段已存在，跳过创建';
    END IF;

    RAISE NOTICE '🎉 所有取消相关字段检查完成';

END $$;

-- 添加字段注释
COMMENT ON COLUMN public.pcb_quotes.cancelled_at IS '订单取消时间';
COMMENT ON COLUMN public.pcb_quotes.cancellation_reason IS '取消原因';
COMMENT ON COLUMN public.pcb_quotes.cancelled_by IS '取消操作者: user(用户), admin(管理员), system(系统)';
COMMENT ON COLUMN public.pcb_quotes.can_be_uncancelled IS '是否可以撤销取消(24小时内且未付款)';

-- 创建取消时间索引（用于查询已取消订单）
DO $$
DECLARE
    index_exists BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE tablename = 'pcb_quotes' AND indexname = 'idx_pcb_quotes_cancelled_at'
    ) INTO index_exists;
    
    IF NOT index_exists THEN
        CREATE INDEX idx_pcb_quotes_cancelled_at ON public.pcb_quotes(cancelled_at);
        RAISE NOTICE '✅ 创建 cancelled_at 索引';
    ELSE
        RAISE NOTICE '⚠️ cancelled_at 索引已存在，跳过创建';
    END IF;
END $$;

-- 创建复合索引（状态 + 取消时间，用于高效查询）
DO $$
DECLARE
    index_exists BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE tablename = 'pcb_quotes' AND indexname = 'idx_pcb_quotes_status_cancelled'
    ) INTO index_exists;
    
    IF NOT index_exists THEN
        CREATE INDEX idx_pcb_quotes_status_cancelled ON public.pcb_quotes(status, cancelled_at);
        RAISE NOTICE '✅ 创建 status_cancelled 复合索引';
    ELSE
        RAISE NOTICE '⚠️ status_cancelled 复合索引已存在，跳过创建';
    END IF;
END $$;

RAISE NOTICE '🚀 数据库迁移完成！'; 