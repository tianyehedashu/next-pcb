-- 创建订单状态变更的自动触发器
-- 需要在 order_status_history 表创建之后运行

\echo '🔧 开始创建订单状态变更触发器...'

-- 1. 创建触发器函数来自动记录状态变更
CREATE OR REPLACE FUNCTION public.record_order_status_change()
RETURNS TRIGGER AS $$
DECLARE
  v_user_id UUID;
  v_user_role VARCHAR(20);
  v_user_name VARCHAR(255);
BEGIN
  -- 获取当前用户信息
  v_user_id := auth.uid();
  
  -- 确定用户角色和姓名
  IF v_user_id IS NOT NULL THEN
    SELECT 
      CASE 
        WHEN p.role = 'admin' THEN 'admin'
        ELSE 'user'
      END,
      COALESCE(p.full_name, u.email, 'Unknown User')
    INTO v_user_role, v_user_name
    FROM auth.users u
    LEFT JOIN public.profiles p ON p.id = u.id
    WHERE u.id = v_user_id;
    
    -- 如果没有找到用户信息，设置默认值
    IF v_user_role IS NULL THEN
      v_user_role := 'user';
      v_user_name := 'Unknown User';
    END IF;
  ELSE
    v_user_role := 'system';
    v_user_name := 'System';
  END IF;

  -- 如果状态发生变化，记录到历史表
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.order_status_history (
      order_id,
      from_status,
      to_status,
      changed_by,
      changed_by_role,
      changed_by_name,
      reason,
      metadata,
      created_at
    ) VALUES (
      NEW.id,
      OLD.status,
      NEW.status,
      v_user_id,
      v_user_role,
      v_user_name,
      'Status changed from ' || COALESCE(OLD.status, 'null') || ' to ' || NEW.status,
      jsonb_build_object(
        'table', TG_TABLE_NAME,
        'operation', TG_OP,
        'old_updated_at', OLD.updated_at,
        'new_updated_at', NEW.updated_at
      ),
      timezone('utc'::text, now())
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

\echo '✅ 用户订单状态变更触发器函数创建完成'

-- 2. 为 pcb_quotes 表创建触发器（如果表存在）
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'pcb_quotes') THEN
    -- 删除旧触发器（如果存在）
    DROP TRIGGER IF EXISTS trigger_record_pcb_quotes_status_change ON public.pcb_quotes;
    
    -- 创建新触发器
    CREATE TRIGGER trigger_record_pcb_quotes_status_change
      AFTER UPDATE ON public.pcb_quotes
      FOR EACH ROW
      EXECUTE FUNCTION public.record_order_status_change();
      
    RAISE NOTICE '✅ 为 pcb_quotes 表创建了状态变更触发器';
  ELSE
    RAISE NOTICE '⚠️  pcb_quotes 表不存在，跳过触发器创建';
  END IF;
END
$$;

-- 3. 为 admin_orders 表创建类似的触发器函数
CREATE OR REPLACE FUNCTION public.record_admin_order_status_change()
RETURNS TRIGGER AS $$
DECLARE
  v_user_id UUID;
  v_user_role VARCHAR(20);
  v_user_name VARCHAR(255);
BEGIN
  -- 获取当前用户信息
  v_user_id := auth.uid();
  
  -- 管理员操作
  IF v_user_id IS NOT NULL THEN
    SELECT 
      'admin',
      COALESCE(p.full_name, u.email, 'Admin User')
    INTO v_user_role, v_user_name
    FROM auth.users u
    LEFT JOIN public.profiles p ON p.id = u.id
    WHERE u.id = v_user_id;
    
    IF v_user_name IS NULL THEN
      v_user_name := 'Admin User';
    END IF;
  ELSE
    v_user_role := 'system';
    v_user_name := 'System';
  END IF;

  -- 如果状态发生变化，记录到历史表
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.order_status_history (
      order_id,
      from_status,
      to_status,
      changed_by,
      changed_by_role,
      changed_by_name,
      reason,
      metadata,
      created_at
    ) VALUES (
      NEW.user_order_id, -- admin_orders 表中的 user_order_id 对应 pcb_quotes 的 id
      OLD.status,
      NEW.status,
      v_user_id,
      v_user_role,
      v_user_name,
      'Admin status changed from ' || COALESCE(OLD.status, 'null') || ' to ' || NEW.status,
      jsonb_build_object(
        'table', 'admin_orders',
        'admin_order_id', NEW.id,
        'operation', TG_OP,
        'old_updated_at', OLD.updated_at,
        'new_updated_at', NEW.updated_at
      ),
      timezone('utc'::text, now())
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

\echo '✅ 管理员订单状态变更触发器函数创建完成'

-- 4. 为 admin_orders 表创建触发器（如果表存在）
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'admin_orders') THEN
    -- 删除旧触发器（如果存在）
    DROP TRIGGER IF EXISTS trigger_record_admin_orders_status_change ON public.admin_orders;
    
    -- 创建新触发器
    CREATE TRIGGER trigger_record_admin_orders_status_change
      AFTER UPDATE ON public.admin_orders
      FOR EACH ROW
      EXECUTE FUNCTION public.record_admin_order_status_change();
      
    RAISE NOTICE '✅ 为 admin_orders 表创建了状态变更触发器';
  ELSE
    RAISE NOTICE '⚠️  admin_orders 表不存在，跳过触发器创建';
  END IF;
END
$$;

-- 5. 创建便捷查询函数
CREATE OR REPLACE FUNCTION public.get_order_status_history(p_order_id UUID)
RETURNS TABLE (
  id UUID,
  from_status VARCHAR(50),
  to_status VARCHAR(50),
  changed_by_name VARCHAR(255),
  changed_by_role VARCHAR(20),
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- 检查权限：管理员或订单所有者
  IF NOT (
    EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin') OR
    EXISTS (SELECT 1 FROM public.pcb_quotes WHERE pcb_quotes.id = p_order_id AND pcb_quotes.user_id = auth.uid())
  ) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  RETURN QUERY
  SELECT 
    osh.id,
    osh.from_status,
    osh.to_status,
    osh.changed_by_name,
    osh.changed_by_role,
    osh.reason,
    osh.created_at
  FROM public.order_status_history osh
  WHERE osh.order_id = p_order_id
  ORDER BY osh.created_at DESC;
END;
$$;

COMMENT ON FUNCTION public.get_order_status_history(UUID) IS '获取指定订单的状态变更历史';

\echo '✅ 便捷查询函数创建完成'

-- 6. 创建视图以便于查询
CREATE OR REPLACE VIEW public.order_status_history_with_details AS
SELECT 
  osh.*,
  pq.email as order_email,
  pq.user_id as order_user_id,
  pq.status as current_status,
  u.email as changed_by_email,
  p.full_name as changed_by_full_name
FROM public.order_status_history osh
LEFT JOIN public.pcb_quotes pq ON pq.id = osh.order_id
LEFT JOIN auth.users u ON u.id = osh.changed_by
LEFT JOIN public.profiles p ON p.id = osh.changed_by;

COMMENT ON VIEW public.order_status_history_with_details IS '订单状态历史详细视图 - 包含关联的订单和用户信息';

\echo '✅ 详细视图创建完成'

\echo '🎉 订单状态变更触发器创建完成！'
\echo ''
\echo '📋 创建内容总结：'
\echo '  ✅ 用户订单状态变更触发器函数'
\echo '  ✅ pcb_quotes 表状态变更触发器'
\echo '  ✅ 管理员订单状态变更触发器函数'
\echo '  ✅ admin_orders 表状态变更触发器'
\echo '  ✅ 便捷查询函数'
\echo '  ✅ 详细视图'
\echo ''
\echo '🔍 使用示例：'
\echo '  -- 查看订单状态历史'
\echo '  SELECT * FROM get_order_status_history(''your-order-id'');'
\echo ''
\echo '  -- 查看详细状态历史（管理员）'
\echo '  SELECT * FROM order_status_history_with_details ORDER BY created_at DESC LIMIT 50;'
\echo ''
\echo '  -- 测试触发器'
\echo '  UPDATE pcb_quotes SET status = ''reviewed'' WHERE id = ''your-order-id'';' 