-- 收货地址表
create table if not exists public.addresses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id),
  country text not null,
  state text,
  city text,
  zip text,
  address text not null,
  phone text,
  email text,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- 报关信息表
create table if not exists public.customs_declarations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id),
  declaration_method text not null,
  company_name text,
  tax_id text,
  personal_id text,
  incoterm text,
  purpose text,
  declared_value numeric,
  customs_note text,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- 订单主表
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id),
  address_id uuid references addresses(id),
  customs_id uuid references customs_declarations(id),
  pcb_spec jsonb not null,
  gerber_file_url text,
  courier text,
  price numeric,
  shipping_cost numeric,
  customs_fee numeric,
  total numeric,
  pcb_note text,
  user_note text,
  status text default 'pending',
  admin_price numeric, -- 管理员审核后可填写
  admin_note text,     -- 管理员审核备注
  admin_update_reason text[], -- 管理员多次修改原因
  created_at timestamp with time zone default timezone('utc'::text, now())
); 