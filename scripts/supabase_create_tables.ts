import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

// 读取 .env.local
const envPath = path.resolve(__dirname, '../.env.local');
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
} else {
  console.error('.env.local not found!');
  process.exit(1);
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseKey) {
  console.error('Supabase URL or Key not found in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function createTables() {
  // addresses
  const addressesSql = `
    create table if not exists public.addresses (
      id bigint generated by default as identity primary key,
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
  `;
  // customs_declarations
  const customsSql = `
    create table if not exists public.customs_declarations (
      id bigint generated by default as identity primary key,
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
  `;
  // orders
  const ordersSql = `
    create table if not exists public.orders (
      id bigint generated by default as identity primary key,
      user_id uuid references auth.users(id),
      address_id bigint references addresses(id),
      customs_id bigint references customs_declarations(id),
      pcb_spec jsonb not null,
      gerber_file_url text,
      courier text,
      price numeric,
      shipping_cost numeric,
      customs_fee numeric,
      total numeric,
      pcb_note text,
      user_note text,
      status text default 'created',
      admin_price numeric,
      admin_note text,
      created_at timestamp with time zone default timezone('utc'::text, now())
    );
  `;

  // 依次执行
  for (const [name, sql] of [
    ['addresses', addressesSql],
    ['customs_declarations', customsSql],
    ['orders', ordersSql],
  ]) {
    // Supabase JS SDK 不支持直接执行 DDL，需用 RPC 或 REST API
    // 这里用 PostgREST 的 /rpc/execute_sql 方案（需自定义函数）
    // 推荐用 SQL CLI 或 Supabase 控制台直接执行 supaddl.sql
    console.log(`请手动在 Supabase SQL Editor 执行如下建表语句以创建 ${name} 表：\n`);
    console.log(sql);
  }
}

createTables().then(() => {
  console.log('建表 SQL 已输出。');
  process.exit(0);
}); 