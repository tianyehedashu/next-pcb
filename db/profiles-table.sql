-- 创建 profiles 表
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  role text not null default 'user' check (role in ('admin', 'user', 'guest')),
  company_name text,
  phone text,
  address text,
  last_login timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 启用行级安全性
alter table public.profiles enable row level security;

-- 允许用户读取自己的 profile
create policy "Users can view own profile."
  on profiles for select
  using (auth.uid() = id);

-- 允许用户插入自己的 profile
create policy "Users can insert their own profile."
  on profiles for insert
  with check (auth.uid() = id);

-- 允许用户更新自己的 profile
create policy "Users can update own profile."
  on profiles for update
  using (auth.uid() = id);

-- 新用户注册时自动创建 profile
create function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id) values (new.id);
  return new;
end;
$$ language plpgsql;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 补全历史用户 profile（可选）
-- insert into public.profiles (id) select id from auth.users where id not in (select id from public.profiles); 