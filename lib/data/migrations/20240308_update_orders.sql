-- 修改 admin_orders 表，添加唯一约束确保一对一关系
ALTER TABLE public.admin_orders
ADD CONSTRAINT unique_user_order_id UNIQUE (user_order_id);

-- 添加外键约束
ALTER TABLE public.admin_orders
ADD CONSTRAINT fk_user_order
FOREIGN KEY (user_order_id)
REFERENCES public.user_orders(id)
ON DELETE CASCADE;

-- 添加索引以提高查询性能
CREATE INDEX idx_admin_orders_user_order_id ON public.admin_orders(user_order_id);

-- 更新 RLS 策略
ALTER TABLE public.admin_orders ENABLE ROW LEVEL SECURITY;

-- 管理员可以查看所有订单
CREATE POLICY "Admins can view all admin orders"
ON public.admin_orders FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- 管理员可以更新所有订单
CREATE POLICY "Admins can update all admin orders"
ON public.admin_orders FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- 管理员可以插入新订单
CREATE POLICY "Admins can insert admin orders"
ON public.admin_orders FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- 管理员可以删除订单
CREATE POLICY "Admins can delete admin orders"
ON public.admin_orders FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
); 