-- Row Level Security (RLS) 策略配置
-- 本文件用于配置 addresses、customs_declarations、orders 三个表的行级权限控制
-- 适用于海外独立站，确保用户只能操作自己的数据，防止越权访问

-- 1. 启用 RLS
alter table public.addresses enable row level security; -- 启用 addresses 表的行级安全
alter table public.customs_declarations enable row level security; -- 启用 customs_declarations 表的行级安全
alter table public.orders enable row level security; -- 启用 orders 表的行级安全

-- 2. 用户只能操作自己的数据（增删查改）
-- 仅允许 user_id 等于当前登录用户的行被操作
create policy "Users can manage their own addresses"
  on public.addresses
  for all
  using (user_id = auth.uid());

create policy "Users can manage their own customs declarations"
  on public.customs_declarations
  for all
  using (user_id = auth.uid());

create policy "Users can manage their own orders"
  on public.orders
  for all
  using (user_id = auth.uid());

-- 3. 只允许插入属于自己的数据
-- 防止用户伪造 user_id 插入他人数据
create policy "Users can only insert their own addresses"
  on public.addresses
  for insert
  with check (user_id = auth.uid());

create policy "Users can only insert their own customs declarations"
  on public.customs_declarations
  for insert
  with check (user_id = auth.uid());

create policy "Users can only insert their own orders"
  on public.orders
  for insert
  with check (user_id = auth.uid());

-- 4. （可选）管理员可管理所有数据
-- 如有管理员角色，可根据 JWT claim 或 service_role 放开权限
-- 例：auth.role() = 'service_role' 或 auth.jwt() ->> 'role' = 'admin'
-- 具体实现请根据你的业务需求调整 