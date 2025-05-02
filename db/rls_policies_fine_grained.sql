-- 更细粒度 RLS 策略配置
-- 适用于 PCB 海外独立站业务
-- 1. 启用 RLS
alter table public.addresses enable row level security;
alter table public.customs_declarations enable row level security;
alter table public.orders enable row level security;

-- 2. addresses 表
-- 用户只能查询、更新、删除自己的地址
create policy "Users can select their own addresses"
  on public.addresses
  for select
  using (user_id = auth.uid());
create policy "Users can update their own addresses"
  on public.addresses
  for update
  using (user_id = auth.uid());
create policy "Users can delete their own addresses"
  on public.addresses
  for delete
  using (user_id = auth.uid());
-- 只允许插入属于自己的地址
create policy "Users can insert their own addresses"
  on public.addresses
  for insert
  with check (user_id = auth.uid());
-- 管理员可管理所有地址
create policy "Admins can manage all addresses"
  on public.addresses
  for all
  using (auth.role() = 'service_role' or (auth.jwt() ->> 'role') = 'admin');

-- 3. customs_declarations 表
-- 用户只能操作自己的报关信息
create policy "Users can select their own customs declarations"
  on public.customs_declarations
  for select
  using (user_id = auth.uid());
create policy "Users can update their own customs declarations"
  on public.customs_declarations
  for update
  using (user_id = auth.uid());
create policy "Users can delete their own customs declarations"
  on public.customs_declarations
  for delete
  using (user_id = auth.uid());
create policy "Users can insert their own customs declarations"
  on public.customs_declarations
  for insert
  with check (user_id = auth.uid());
create policy "Admins can manage all customs declarations"
  on public.customs_declarations
  for all
  using (auth.role() = 'service_role' or (auth.jwt() ->> 'role') = 'admin');

-- 4. orders 表
-- 用户只能查询自己的订单
create policy "Users can select their own orders"
  on public.orders
  for select
  using (user_id = auth.uid());
-- 用户只能插入属于自己的订单
create policy "Users can insert their own orders"
  on public.orders
  for insert
  with check (user_id = auth.uid());
-- 用户只能更新/删除自己未支付（pending）订单
create policy "Users can update their own pending orders"
  on public.orders
  for update
  using (user_id = auth.uid() and status = 'pending');
create policy "Users can delete their own pending orders"
  on public.orders
  for delete
  using (user_id = auth.uid() and status = 'pending');
-- 管理员可管理所有订单
create policy "Admins can manage all orders"
  on public.orders
  for all
  using (auth.role() = 'service_role' or (auth.jwt() ->> 'role') = 'admin'); 