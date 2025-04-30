# Next.js 中间件实现指南

## 中间件概述

Next.js 中间件允许我们在请求完成之前运行代码。这个功能可以用于：
- 认证
- 访问控制
- 日志记录
- 请求重写
- 响应转换
- 头部修改
- Cookie 处理

## 基础实现

### 1. 创建中间件

```typescript
// middleware.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // 获取请求信息
  const pathname = request.nextUrl.pathname
  const headers = request.headers
  
  // 创建响应
  const response = NextResponse.next()
  
  // 修改响应头
  response.headers.set('x-custom-header', 'custom-value')
  
  return response
}

// 配置中间件匹配路径
export const config = {
  matcher: [
    '/api/:path*',
    '/protected/:path*',
    '/((?!api|_next/static|_next/image|favicon.ico).*)'
  ]
}
```

### 2. 认证中间件示例

```typescript
// middleware.ts
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req: request, res })

  // 验证会话
  const { data: { session } } = await supabase.auth.getSession()

  // 未认证用户重定向
  if (!session && request.nextUrl.pathname.startsWith('/protected')) {
    const redirectUrl = new URL('/auth/login', request.url)
    redirectUrl.searchParams.set('from', request.nextUrl.pathname)
    return NextResponse.redirect(redirectUrl)
  }

  // 已认证用户的特殊处理
  if (session) {
    // 添加用户信息到请求头
    res.headers.set('x-user-id', session.user.id)
    res.headers.set('x-user-role', session.user.role)
  }

  return res
}
```

## 高级功能

### 1. 地理位置检测

```typescript
export function middleware(request: NextRequest) {
  // 获取地理位置信息
  const country = request.geo?.country
  const city = request.geo?.city
  
  // 基于地理位置重定向
  if (country === 'US') {
    return NextResponse.redirect(new URL('/us', request.url))
  }
  
  // 添加地理位置信息到头部
  const response = NextResponse.next()
  response.headers.set('x-user-country', country || 'unknown')
  return response
}
```

### 2. A/B 测试实现

```typescript
export function middleware(request: NextRequest) {
  const response = NextResponse.next()
  
  // 获取或设置 AB 测试 cookie
  let bucket = request.cookies.get('ab-test-bucket')
  
  if (!bucket) {
    // 随机分配用户到 A 或 B 组
    bucket = Math.random() < 0.5 ? 'A' : 'B'
    response.cookies.set('ab-test-bucket', bucket)
  }
  
  // 添加 AB 测试信息到响应头
  response.headers.set('x-ab-test-bucket', bucket)
  return response
}
```

### 3. 请求限流

```typescript
import { Redis } from '@upstash/redis'

const rateLimit = {
  window: 60, // 时间窗口（秒）
  maxRequests: 100 // 最大请求数
}

export async function middleware(request: NextRequest) {
  const ip = request.ip || 'anonymous'
  const redis = Redis.fromEnv()
  
  // 获取当前请求数
  const current = await redis.incr(`ratelimit:${ip}`)
  
  // 首次请求设置过期时间
  if (current === 1) {
    await redis.expire(`ratelimit:${ip}`, rateLimit.window)
  }
  
  // 超出限制返回 429
  if (current > rateLimit.maxRequests) {
    return new NextResponse('Too Many Requests', { status: 429 })
  }
  
  const response = NextResponse.next()
  response.headers.set('X-RateLimit-Limit', rateLimit.maxRequests.toString())
  response.headers.set('X-RateLimit-Remaining', (rateLimit.maxRequests - current).toString())
  return response
}
```

## 最佳实践

### 1. 性能优化

```typescript
export async function middleware(request: NextRequest) {
  // 避免不必要的处理
  if (request.nextUrl.pathname.startsWith('/_next/')) {
    return NextResponse.next()
  }
  
  // 使用 URL 对象进行路径匹配
  const url = request.nextUrl.clone()
  if (url.pathname === '/old-path') {
    url.pathname = '/new-path'
    return NextResponse.redirect(url)
  }
  
  // 缓存控制
  const response = NextResponse.next()
  response.headers.set('Cache-Control', 'public, max-age=3600')
  return response
}
```

### 2. 错误处理

```typescript
export async function middleware(request: NextRequest) {
  try {
    // 中间件逻辑
    const response = NextResponse.next()
    return response
  } catch (error) {
    // 错误日志记录
    console.error('Middleware Error:', error)
    
    // 返回优雅的错误响应
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}
```

### 3. 条件匹配

```typescript
export const config = {
  matcher: [
    // 匹配所有 API 路由
    '/api/:path*',
    
    // 匹配动态路由
    '/blog/:path*',
    
    // 排除特定路径
    '/((?!api|_next/static|favicon.ico).*)',
    
    // 自定义函数匹配
    {
      source: '/:path*',
      has: [{ type: 'header', key: 'x-custom-header' }]
    }
  ]
}
```

## 调试技巧

### 1. 请求信息调试

```typescript
export function middleware(request: NextRequest) {
  // 打印请求信息
  console.log({
    url: request.url,
    method: request.method,
    headers: Object.fromEntries(request.headers),
    cookies: request.cookies.getAll(),
    geo: request.geo
  })
  
  return NextResponse.next()
}
```

### 2. 响应修改调试

```typescript
export function middleware(request: NextRequest) {
  const response = NextResponse.next()
  
  // 记录响应修改
  console.log('Original headers:', response.headers.entries())
  response.headers.set('x-modified', 'true')
  console.log('Modified headers:', response.headers.entries())
  
  return response
}
```

## 注意事项

1. **执行顺序**
   - 中间件在 Edge Runtime 中执行
   - 在页面渲染之前运行
   - 按照 matcher 配置的顺序执行

2. **限制**
   - 不能访问服务器端环境变量
   - 不能直接访问数据库
   - 必须返回 Response 对象
   - 不支持 Node.js API

3. **性能考虑**
   - 尽量减少中间件中的计算
   - 避免不必要的异步操作
   - 合理使用缓存
   - 优化匹配规则

4. **安全建议**
   - 验证所有用户输入
   - 使用安全的头部
   - 实现适当的速率限制
   - 保护敏感信息 