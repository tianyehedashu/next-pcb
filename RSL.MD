3. RLS（Row Level Security）策略示例
假设你有一个 orders 表，每个订单有 user_id 字段，表示归属哪个用户。
步骤：
在 Supabase 控制台 → Table Editor → 选择 orders 表 → 启用 RLS（Row Level Security）。
添加如下 Policy：
只允许用户访问自己的订单：


-- 允许用户读取自己的订单
CREATE POLICY "Users can view their own orders"
ON public.orders
FOR SELECT
USING (user_id = auth.uid());

-- 允许用户插入自己的订单
CREATE POLICY "Users can insert their own orders"
ON public.orders
FOR INSERT
WITH CHECK (user_id = auth.uid());