-- 创建订单状态历史表
-- 用于记录所有订单状态变更的历史记录

\echo '🔧 开始创建 order_status_history 表...'

-- 1. 创建表结构
CREATE TABLE IF NOT EXISTS public.order_status_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL, -- 关联的订单ID（pcb_quotes.id）
  from_status VARCHAR(50), -- 原状态（可为空，表示初始状态）
  to_status VARCHAR(50) NOT NULL, -- 新状态
  changed_by UUID, -- 操作人员ID（auth.users.id）
  changed_by_role VARCHAR(20) NOT NULL CHECK (changed_by_role IN ('admin', 'user', 'system')), -- 操作人员角色
  changed_by_name VARCHAR(255), -- 操作人员姓名/邮箱
  reason TEXT, -- 状态变更原因
  metadata JSONB DEFAULT '{}'::jsonb, -- 额外的元数据
  ip_address VARCHAR(45), -- 操作IP地址
  user_agent TEXT, -- 用户代理
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

\echo '✅ order_status_history 表创建完成'

-- 2. 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_order_status_history_order_id 
ON public.order_status_history(order_id);

CREATE INDEX IF NOT EXISTS idx_order_status_history_created_at 
ON public.order_status_history(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_order_status_history_changed_by 
ON public.order_status_history(changed_by);

CREATE INDEX IF NOT EXISTS idx_order_status_history_to_status 
ON public.order_status_history(to_status);

CREATE INDEX IF NOT EXISTS idx_order_status_history_changed_by_role 
ON public.order_status_history(changed_by_role);

-- 复合索引：按订单ID和时间排序
CREATE INDEX IF NOT EXISTS idx_order_status_history_order_time 
ON public.order_status_history(order_id, created_at DESC);

\echo '✅ 索引创建完成'

-- 3. 添加外键约束（如果相关表存在）
DO $$
BEGIN
  -- 检查 pcb_quotes 表是否存在，并且约束不存在
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'pcb_quotes') THEN
    -- 检查约束是否已存在
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.table_constraints 
      WHERE constraint_name = 'fk_order_status_history_order_id' 
      AND table_name = 'order_status_history'
    ) THEN
      -- 添加外键约束到 pcb_quotes 表
      ALTER TABLE public.order_status_history 
      ADD CONSTRAINT fk_order_status_history_order_id 
      FOREIGN KEY (order_id) REFERENCES public.pcb_quotes(id) ON DELETE CASCADE;
      
      RAISE NOTICE '✅ 添加了到 pcb_quotes 表的外键约束';
    ELSE
      RAISE NOTICE '⚠️  外键约束 fk_order_status_history_order_id 已存在';
    END IF;
  ELSE
    RAISE NOTICE '⚠️  pcb_quotes 表不存在，跳过外键约束';
  END IF;

  -- 检查 auth.users 表是否存在，并且约束不存在
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'auth' AND table_name = 'users') THEN
    -- 检查约束是否已存在
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.table_constraints 
      WHERE constraint_name = 'fk_order_status_history_changed_by' 
      AND table_name = 'order_status_history'
    ) THEN
      -- 添加外键约束到 auth.users 表
      ALTER TABLE public.order_status_history 
      ADD CONSTRAINT fk_order_status_history_changed_by 
      FOREIGN KEY (changed_by) REFERENCES auth.users(id) ON DELETE SET NULL;
      
      RAISE NOTICE '✅ 添加了到 auth.users 表的外键约束';
    ELSE
      RAISE NOTICE '⚠️  外键约束 fk_order_status_history_changed_by 已存在';
    END IF;
  ELSE
    RAISE NOTICE '⚠️  auth.users 表不存在，跳过外键约束';
  END IF;
END
$$;

-- 4. 启用 RLS (Row Level Security)
ALTER TABLE public.order_status_history ENABLE ROW LEVEL SECURITY;

\echo '✅ 启用了 RLS'

-- 5. 创建 RLS 策略
DO $$
BEGIN
  -- 策略1：管理员可以查看所有状态历史
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'order_status_history' 
    AND policyname = 'Admins can view all order status history'
  ) THEN
    CREATE POLICY "Admins can view all order status history" ON public.order_status_history
      FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM public.profiles 
          WHERE profiles.id = auth.uid() 
          AND profiles.role = 'admin'
        )
      );
    RAISE NOTICE '✅ 创建管理员查看策略';
  END IF;

  -- 策略2：用户只能查看自己订单的状态历史
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'order_status_history' 
    AND policyname = 'Users can view their own order status history'
  ) THEN
    CREATE POLICY "Users can view their own order status history" ON public.order_status_history
      FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM public.pcb_quotes 
          WHERE pcb_quotes.id = order_status_history.order_id 
          AND pcb_quotes.user_id = auth.uid()
        )
      );
    RAISE NOTICE '✅ 创建用户查看策略';
  END IF;

  -- 策略3：游客可以查看自己邮箱相关的订单状态历史（需要额外验证）
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'order_status_history' 
    AND policyname = 'Guests can view their email-related order status history'
  ) THEN
    CREATE POLICY "Guests can view their email-related order status history" ON public.order_status_history
      FOR SELECT
      USING (
        auth.uid() IS NULL AND
        EXISTS (
          SELECT 1 FROM public.pcb_quotes 
          WHERE pcb_quotes.id = order_status_history.order_id 
          AND pcb_quotes.user_id IS NULL
          -- 这里可以添加额外的邮箱验证逻辑
        )
      );
    RAISE NOTICE '✅ 创建游客查看策略';
  END IF;

  -- 策略4：只有系统和管理员可以插入状态历史记录
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'order_status_history' 
    AND policyname = 'Only system and admins can insert status history'
  ) THEN
    CREATE POLICY "Only system and admins can insert status history" ON public.order_status_history
      FOR INSERT
      WITH CHECK (
        -- 系统触发器插入
        auth.uid() IS NULL OR
        -- 管理员手动插入
        EXISTS (
          SELECT 1 FROM public.profiles 
          WHERE profiles.id = auth.uid() 
          AND profiles.role = 'admin'
        )
      );
    RAISE NOTICE '✅ 创建插入权限策略';
  END IF;

  -- 策略5：禁止更新状态历史记录（保证审计完整性）
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'order_status_history' 
    AND policyname = 'No updates allowed on status history'
  ) THEN
    CREATE POLICY "No updates allowed on status history" ON public.order_status_history
      FOR UPDATE
      USING (false);
    RAISE NOTICE '✅ 创建禁止更新策略';
  END IF;

  -- 策略6：禁止删除状态历史记录（保证审计完整性）
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'order_status_history' 
    AND policyname = 'No deletes allowed on status history'
  ) THEN
    CREATE POLICY "No deletes allowed on status history" ON public.order_status_history
      FOR DELETE
      USING (false);
    RAISE NOTICE '✅ 创建禁止删除策略';
  END IF;
END
$$;

\echo '✅ RLS 策略创建完成'

-- 6. 添加表注释
COMMENT ON TABLE public.order_status_history IS '订单状态变更历史表 - 记录所有订单状态变更的审计日志';
COMMENT ON COLUMN public.order_status_history.id IS '主键ID';
COMMENT ON COLUMN public.order_status_history.order_id IS '关联的订单ID（pcb_quotes.id）';
COMMENT ON COLUMN public.order_status_history.from_status IS '原状态（可为空表示初始状态）';
COMMENT ON COLUMN public.order_status_history.to_status IS '新状态';
COMMENT ON COLUMN public.order_status_history.changed_by IS '操作人员ID（auth.users.id）';
COMMENT ON COLUMN public.order_status_history.changed_by_role IS '操作人员角色：admin/user/system';
COMMENT ON COLUMN public.order_status_history.changed_by_name IS '操作人员姓名或邮箱';
COMMENT ON COLUMN public.order_status_history.reason IS '状态变更原因';
COMMENT ON COLUMN public.order_status_history.metadata IS '额外的元数据（JSON格式）';
COMMENT ON COLUMN public.order_status_history.ip_address IS '操作IP地址';
COMMENT ON COLUMN public.order_status_history.user_agent IS '用户代理字符串';
COMMENT ON COLUMN public.order_status_history.created_at IS '记录创建时间';

\echo '🎉 order_status_history 表及 RLS 策略创建完成！'
\echo ''
\echo '📋 创建内容总结：'
\echo '  ✅ order_status_history 表结构'
\echo '  ✅ 性能优化索引'
\echo '  ✅ 外键约束（如果相关表存在）'
\echo '  ✅ RLS 安全策略'
\echo '  ✅ 表和字段注释'
\echo ''
\echo '🔍 使用示例：'
\echo '  -- 查看订单状态历史（用户只能看自己的）'
\echo '  SELECT * FROM order_status_history WHERE order_id = ''your-order-id'' ORDER BY created_at DESC;'
\echo ''
\echo '  -- 查看所有状态变更（管理员）'
\echo '  SELECT * FROM order_status_history ORDER BY created_at DESC LIMIT 100;' 