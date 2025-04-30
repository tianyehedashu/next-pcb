# Next.js + Supabase 用户认证与权限管理实现文档

## 架构概览

本项目使用 Next.js 13+ 和 Supabase 实现了完整的用户认证和权限管理系统。该实现提供了类型安全、实时更新和细粒度的访问控制。

## 核心功能

### 1. 用户认证
- 基于 Supabase Auth 的完整身份验证系统
- 支持邮箱/密码登录
- 会话管理和自动刷新
- 客户端状态实时同步

### 2. 用户角色系统
实现了三级角色划分：
- `admin`: 系统管理员
- `user`: 普通用户
- `guest`: 访客用户

### 3. 权限管理
每个角色拥有预定义的权限集：
```typescript
const rolePermissions = {
  admin: ["read", "write", "delete", "manage_users", "view_analytics"],
  user: ["read", "write"],
  guest: ["read"]
}
```

### 4. 用户资料管理
用户资料表 (`profiles`) 包含以下字段：
- `id`: 用户唯一标识符
- `role`: 用户角色
- `company_name`: 公司名称
- `phone`: 联系电话
- `address`: 地址
- `last_login`: 最后登录时间
- `created_at`: 创建时间
- `updated_at`: 更新时间

## 技术实现

### 1. 数据库结构
```sql
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
```

### 2. 行级安全性 (RLS)
实现了以下安全策略：
- 所有用户可查看公开资料
- 用户只能修改自己的资料
- 管理员可以管理所有用户资料

### 3. 用户上下文实现
```typescript
interface UserContextType {
  user: ExtendedUser | null;
  isLoading: boolean;
  isAdmin: boolean;
  hasPermission: (permission: string) => boolean;
}
```

### 4. 自动化触发器
- 新用户注册自动创建资料
- 资料更新时自动更新时间戳

## 使用示例

### 1. 检查用户权限
```typescript
const { hasPermission } = useUser();

if (hasPermission('manage_users')) {
  // 执行管理用户操作
}
```

### 2. 获取用户信息
```typescript
const { user, isAdmin } = useUser();

if (isAdmin) {
  // 显示管理员功能
}
```

### 3. 资料更新表单
```typescript
const ProfileForm = () => {
  // 表单实现
  // 包含用户资料字段
  // 使用 React Hook Form 进行表单验证
  // 使用 Zod 进行类型验证
};
```

## 优势特点

1. **类型安全**
   - 使用 TypeScript 确保类型安全
   - Zod 验证确保数据完整性
   - 完整的类型定义和接口

2. **安全性**
   - 行级安全策略
   - 细粒度的权限控制
   - 安全的密码处理

3. **实时性**
   - Supabase 实时订阅
   - 状态实时同步
   - 自动会话管理

4. **可扩展性**
   - 模块化设计
   - 易于添加新的角色和权限
   - 灵活的用户资料扩展

5. **开发体验**
   - 完整的 TypeScript 支持
   - 集成开发工具支持
   - 清晰的代码组织

6. **性能优化**
   - 服务端渲染支持
   - 高效的状态管理
   - 优化的数据获取

## 最佳实践

1. **权限检查**
   - 始终使用 `hasPermission` 函数检查权限
   - 在服务器端和客户端都进行权限验证
   - 避免硬编码权限检查

2. **数据获取**
   - 使用 Supabase 客户端进行数据操作
   - 利用 RLS 策略确保数据安全
   - 实现适当的错误处理

3. **状态管理**
   - 使用 UserContext 管理用户状态
   - 实现必要的加载状态
   - 处理错误情况

## 后续优化建议

1. 添加更多的认证方式（如社交媒体登录）
2. 实现更细粒度的权限控制
3. 添加用户活动日志
4. 实现多因素认证
5. 增强密码策略
6. 添加用户行为分析 

## 详细实现步骤

### 1. Supabase 项目设置

1. **创建 Supabase 项目**
```bash
# 安装 Supabase CLI
npm install @supabase/supabase-js @supabase/auth-helpers-nextjs
```

2. **环境变量配置**
在 `.env.local` 文件中添加：
```env
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 2. 数据库设置

1. **创建用户资料表**
```sql
-- 创建用户资料表
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

-- 创建访问策略
create policy "Public profiles are viewable by everyone."
  on profiles for select using ( true );

create policy "Users can insert their own profile."
  on profiles for insert with check ( auth.uid() = id );

create policy "Users can update own profile."
  on profiles for update using ( auth.uid() = id );
```

2. **创建触发器**
```sql
-- 更新时间戳触发器
create function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql;

create trigger handle_profiles_updated_at
  before update on public.profiles
  for each row
  execute procedure public.handle_updated_at();

-- 新用户触发器
create function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id)
  values (new.id);
  return new;
end;
$$ language plpgsql;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
```

### 3. Next.js 集成实现

1. **创建 Supabase 客户端**
```typescript
// lib/supabase.ts
import { createBrowserSupabaseClient } from '@supabase/auth-helpers-nextjs';

export const createClient = () => createBrowserSupabaseClient();
```

2. **用户类型定义**
```typescript
// types/user.ts
export type UserRole = "admin" | "user" | "guest";

export interface ExtendedUser extends User {
  role?: UserRole;
  company_name?: string;
  phone?: string;
  address?: string;
  last_login?: Date;
}
```

3. **用户上下文实现**
```typescript
// lib/UserContext.tsx
"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { User, Session } from "@supabase/supabase-js";
import { createBrowserSupabaseClient } from "@supabase/auth-helpers-nextjs";

const UserContext = createContext<UserContextType>({
  user: null,
  isLoading: true,
  isAdmin: false,
  hasPermission: () => false,
});

export function UserProvider({ children, initialUser }: { 
  children: React.ReactNode;
  initialUser?: ExtendedUser | null;
}) {
  const [user, setUser] = useState<ExtendedUser | null>(initialUser ?? null);
  const [isLoading, setIsLoading] = useState(!initialUser);

  useEffect(() => {
    const supabase = createBrowserSupabaseClient();

    const { data: listener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", session.user.id)
            .single();

          setUser({
            ...session.user,
            role: profile?.role || "user",
            company_name: profile?.company_name,
            phone: profile?.phone,
            address: profile?.address,
            last_login: profile?.last_login,
          });
        } else {
          setUser(null);
        }
        setIsLoading(false);
      }
    );

    return () => {
      listener?.subscription.unsubscribe();
    };
  }, []);

  return (
    <UserContext.Provider value={{ 
      user, 
      isLoading,
      isAdmin: user?.role === "admin",
      hasPermission: (permission) => {
        if (!user?.role) return false;
        return rolePermissions[user.role].includes(permission);
      }
    }}>
      {children}
    </UserContext.Provider>
  );
}
```

4. **资料更新表单实现**
```typescript
// app/profile/profile-form.tsx
"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"

const formSchema = z.object({
  username: z.string().min(2),
  email: z.string().email(),
  company_name: z.string().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
});

export function ProfileForm() {
  const supabase = createClientComponentClient();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { error } = await supabase
        .from("profiles")
        .upsert({
          id: session.user.id,
          ...values,
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;
    } catch (error) {
      console.error(error);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        {/* 表单字段实现 */}
      </form>
    </Form>
  );
}
```

### 4. 中间件实现

1. **认证中间件**
```typescript
// middleware.ts
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })

  const {
    data: { session },
  } = await supabase.auth.getSession()

  // 检查认证状态
  if (!session && req.nextUrl.pathname.startsWith('/protected')) {
    return NextResponse.redirect(new URL('/auth/login', req.url))
  }

  return res
}

export const config = {
  matcher: ['/protected/:path*', '/api/:path*'],
}
```

### 5. API 路由保护

1. **创建受保护的 API 路由**
```typescript
// app/api/protected/route.ts
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const supabase = createRouteHandlerClient({ cookies })

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    return new NextResponse(
      JSON.stringify({
        error: 'unauthorized'
      }),
      {
        status: 401,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    )
  }

  // 进行授权检查
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', session.user.id)
    .single()

  if (!profile || !rolePermissions[profile.role].includes('required_permission')) {
    return new NextResponse(
      JSON.stringify({
        error: 'forbidden'
      }),
      {
        status: 403,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    )
  }

  // 处理授权请求
  return NextResponse.json({
    data: 'protected data'
  })
}
```

### 6. 客户端使用

1. **在组件中使用用户上下文**
```typescript
// app/components/ProtectedComponent.tsx
"use client"

import { useUser } from "@/lib/UserContext"

export function ProtectedComponent() {
  const { user, isAdmin, hasPermission } = useUser()

  if (!user) return <div>请登录</div>
  
  if (!hasPermission('required_permission')) {
    return <div>无权限访问</div>
  }

  return (
    <div>
      <h1>受保护的内容</h1>
      {isAdmin && <div>管理员专属内容</div>}
    </div>
  )
}
```

2. **处理登录状态**
```typescript
// app/auth/login/page.tsx
"use client"

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useRouter } from 'next/navigation'

export default function Login() {
  const router = useRouter()
  const supabase = createClientComponentClient()

  const handleSignIn = async () => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (!error) {
      router.push('/dashboard')
    }
  }

  return (
    // 登录表单实现
  )
}
```

## Next.js 前后端集成说明

在 Next.js 13+ App Router 架构中，我们同时实现了前端和后端的 Supabase 集成。这种集成方式提供了完整的全栈解决方案。

### 1. 前端集成（Client-side）

1. **客户端组件中使用**
```typescript
// app/components/ClientComponent.tsx
"use client"

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

export default function ClientComponent() {
  const supabase = createClientComponentClient()

  // 用于客户端操作的方法
  const handleSignIn = async () => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })
  }

  // 实时订阅数据变化
  useEffect(() => {
    const channel = supabase
      .channel('table_changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'profiles'
      }, (payload) => {
        // 处理实时更新
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  return <div>客户端组件</div>
}
```

2. **客户端数据获取**
```typescript
// app/components/DataFetching.tsx
"use client"

export function DataFetching() {
  const [data, setData] = useState(null)
  const supabase = createClientComponentClient()

  useEffect(() => {
    async function fetchData() {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
      
      if (data) setData(data)
    }

    fetchData()
  }, [])

  return <div>{/* 渲染数据 */}</div>
}
```

### 2. 后端集成（Server-side）

1. **服务器组件中使用**
```typescript
// app/ServerComponent.tsx
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export default async function ServerComponent() {
  const supabase = createServerComponentClient({ cookies })
  
  // 服务端数据获取
  const { data: profiles } = await supabase
    .from('profiles')
    .select('*')

  return <div>{/* 渲染数据 */}</div>
}
```

2. **API 路由处理**
```typescript
// app/api/profiles/route.ts
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export async function GET() {
  const supabase = createRouteHandlerClient({ cookies })
  
  const { data, error } = await supabase
    .from('profiles')
    .select('*')

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }

  return new Response(JSON.stringify(data), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  })
}
```

3. **服务器操作（Server Actions）**
```typescript
// app/actions.ts
'use server'

import { createServerActionClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export async function updateProfile(formData: FormData) {
  const supabase = createServerActionClient({ cookies })
  
  const { error } = await supabase
    .from('profiles')
    .update({
      name: formData.get('name'),
      company_name: formData.get('company_name')
    })
    .eq('id', formData.get('id'))

  return { error }
}
```

### 3. 中间件集成

```typescript
// middleware.ts
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })

  // 刷新 session
  await supabase.auth.getSession()

  // 路由保护
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // 受保护路由处理
  if (!user && req.nextUrl.pathname.startsWith('/protected')) {
    const redirectUrl = req.nextUrl.clone()
    redirectUrl.pathname = '/auth/login'
    redirectUrl.searchParams.set('redirectedFrom', req.nextUrl.pathname)
    return NextResponse.redirect(redirectUrl)
  }

  return res
}
```

### 4. 不同集成方式的使用场景

1. **客户端集成适用于：**
   - 用户交互频繁的功能
   - 实时数据更新
   - 表单处理
   - 状态管理
   - 客户端路由

2. **服务器端集成适用于：**
   - 初始数据加载
   - SEO 要求高的页面
   - 敏感数据处理
   - 大量数据处理
   - 服务器端验证

3. **中间件集成适用于：**
   - 全局认证检查
   - 路由保护
   - Session 管理
   - 请求/响应拦截

### 5. 性能优化考虑

1. **服务器组件优化**
```typescript
// app/OptimizedServerComponent.tsx
import { Suspense } from 'react'
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

async function DataFetching() {
  const supabase = createServerComponentClient({ cookies })
  const { data } = await supabase.from('profiles').select('*')
  return <div>{/* 渲染数据 */}</div>
}

export default function OptimizedServerComponent() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <DataFetching />
    </Suspense>
  )
}
```

2. **客户端缓存策略**
```typescript
// utils/supabase-client.ts
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

export function createCachedClient() {
  const supabase = createClientComponentClient()
  
  return {
    ...supabase,
    async cachedProfiles() {
      const cached = sessionStorage.getItem('profiles')
      if (cached) return JSON.parse(cached)

      const { data } = await supabase.from('profiles').select('*')
      sessionStorage.setItem('profiles', JSON.stringify(data))
      return data
    }
  }
}
```

这种前后端统一的集成方式充分利用了 Next.js 13+ 的新特性，既保证了良好的开发体验，又能确保应用的性能和安全性。通过合理使用不同的集成方式，我们可以在不同场景下选择最适合的解决方案。 