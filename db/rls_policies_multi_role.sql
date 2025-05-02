-- 多角色 RLS 策略配置
-- 支持 user、admin、support 三种角色
-- 1. 启用 RLS
alter table public.addresses enable row level security;
alter table public.customs_declarations enable row level security;
alter table public.orders enable row level security;

-- 2. addresses 表
-- 普通用户只能操作自己的地址
create policy "Users can manage their own addresses"
  on public.addresses
  for all
  using (user_id = auth.uid() and coalesce((auth.jwt() ->> 'role'), 'user') = 'user');
-- support 角色可只读所有地址
create policy "Support can read all addresses"
  on public.addresses
  for select
  using (coalesce((auth.jwt() ->> 'role'), '') = 'support');
-- admin 可管理所有地址
create policy "Admins can manage all addresses"
  on public.addresses
  for all
  using (auth.role() = 'service_role' or coalesce((auth.jwt() ->> 'role'), '') = 'admin');

-- 3. customs_declarations 表
create policy "Users can manage their own customs declarations"
  on public.customs_declarations
  for all
  using (user_id = auth.uid() and coalesce((auth.jwt() ->> 'role'), 'user') = 'user');
create policy "Support can read all customs declarations"
  on public.customs_declarations
  for select
  using (coalesce((auth.jwt() ->> 'role'), '') = 'support');
create policy "Admins can manage all customs declarations"
  on public.customs_declarations
  for all
  using (auth.role() = 'service_role' or coalesce((auth.jwt() ->> 'role'), '') = 'admin');

-- 4. orders 表
create policy "Users can select their own orders"
  on public.orders
  for select
  using (user_id = auth.uid() and coalesce((auth.jwt() ->> 'role'), 'user') = 'user');
create policy "Users can insert their own orders"
  on public.orders
  for insert
  with check (user_id = auth.uid() and coalesce((auth.jwt() ->> 'role'), 'user') = 'user');
create policy "Users can update their own pending orders"
  on public.orders
  for update
  using (user_id = auth.uid() and status = 'pending' and coalesce((auth.jwt() ->> 'role'), 'user') = 'user');
create policy "Users can delete their own pending orders"
  on public.orders
  for delete
  using (user_id = auth.uid() and status = 'pending' and coalesce((auth.jwt() ->> 'role'), 'user') = 'user');
create policy "Support can read all orders"
  on public.orders
  for select
  using (coalesce((auth.jwt() ->> 'role'), '') = 'support');
create policy "Admins can manage all orders"
  on public.orders
  for all
  using (auth.role() = 'service_role' or coalesce((auth.jwt() ->> 'role'), '') = 'admin'); 