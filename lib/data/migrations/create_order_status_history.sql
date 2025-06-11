-- 创建订单状态历史表
CREATE TABLE IF NOT EXISTS order_status_history (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  from_status VARCHAR(50),
  to_status VARCHAR(50) NOT NULL,
  changed_by UUID REFERENCES auth.users(id),
  changed_by_role VARCHAR(20) NOT NULL CHECK (changed_by_role IN ('admin', 'user', 'system')),
  changed_by_name VARCHAR(255),
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建索引以提高查询性能
CREATE INDEX idx_order_status_history_order_id ON order_status_history(order_id);
CREATE INDEX idx_order_status_history_created_at ON order_status_history(created_at DESC);

-- 创建用户订单操作日志表
CREATE TABLE IF NOT EXISTS user_order_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  action VARCHAR(50) NOT NULL,
  changes JSONB,
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建索引
CREATE INDEX idx_user_order_logs_order_id ON user_order_logs(order_id);
CREATE INDEX idx_user_order_logs_user_id ON user_order_logs(user_id);
CREATE INDEX idx_user_order_logs_created_at ON user_order_logs(created_at DESC);

-- 添加触发器函数来自动记录状态变更
CREATE OR REPLACE FUNCTION record_order_status_change()
RETURNS TRIGGER AS $$
BEGIN
  -- 如果状态发生变化，记录到历史表
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO order_status_history (
      order_id,
      from_status,
      to_status,
      changed_by,
      changed_by_role,
      created_at
    ) VALUES (
      NEW.id,
      OLD.status,
      NEW.status,
      auth.uid(),
      CASE 
        WHEN EXISTS (
          SELECT 1 FROM profiles 
          WHERE id = auth.uid() 
          AND role IN ('admin', 'super_admin')
        ) THEN 'admin'
        WHEN auth.uid() IS NOT NULL THEN 'user'
        ELSE 'system'
      END,
      NOW()
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 为orders表创建触发器
CREATE TRIGGER trigger_record_order_status_change
  AFTER UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION record_order_status_change();

-- 为admin_orders表也创建类似的触发器
CREATE OR REPLACE FUNCTION record_admin_order_status_change()
RETURNS TRIGGER AS $$
DECLARE
  v_user_order_id UUID;
BEGIN
  -- 如果状态发生变化，更新用户订单并记录历史
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    -- 获取关联的用户订单ID
    v_user_order_id := NEW.user_order_id;
    
    -- 记录到历史表
    INSERT INTO order_status_history (
      order_id,
      from_status,
      to_status,
      changed_by,
      changed_by_role,
      changed_by_name,
      created_at
    ) VALUES (
      v_user_order_id,
      OLD.status,
      NEW.status,
      auth.uid(),
      'admin',
      (SELECT email FROM auth.users WHERE id = auth.uid()),
      NOW()
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 为admin_orders表创建触发器
CREATE TRIGGER trigger_record_admin_order_status_change
  AFTER UPDATE ON admin_orders
  FOR EACH ROW
  EXECUTE FUNCTION record_admin_order_status_change();

-- 添加RLS政策
ALTER TABLE order_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_order_logs ENABLE ROW LEVEL SECURITY;

-- 管理员可以查看所有记录
CREATE POLICY "Admins can view all order status history" ON order_status_history
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'super_admin')
    )
  );

-- 用户只能查看自己订单的历史
CREATE POLICY "Users can view their own order status history" ON order_status_history
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM orders 
      WHERE orders.id = order_status_history.order_id 
      AND orders.user_id = auth.uid()
    )
  );

-- 管理员可以查看所有日志
CREATE POLICY "Admins can view all order logs" ON user_order_logs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'super_admin')
    )
  );

-- 用户只能查看自己的操作日志
CREATE POLICY "Users can view their own order logs" ON user_order_logs
  FOR SELECT
  USING (user_id = auth.uid()); 