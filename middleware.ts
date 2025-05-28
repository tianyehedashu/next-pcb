import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  // 只拦截需要登录的页面
  if (req.nextUrl.pathname.startsWith('/quote/confirm')) {
    // 创建 supabase 客户端（自动读取 cookie）
    const res = NextResponse.next();
    const supabase = createMiddlewareClient({ req, res });

    // 尝试获取 session
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      // 未登录，重定向到登录页
      const loginUrl = new URL('/auth', req.url);
      loginUrl.searchParams.set('redirect', req.nextUrl.pathname + req.nextUrl.search); // 登录后跳回
      return NextResponse.redirect(loginUrl);
    }
    // 已登录，正常放行
    return res;
  }
  // 其它页面不拦截
  return NextResponse.next();
}

// 只在 /quote/confirm 下生效
export const config = {
  matcher: ['/quote/confirm/:path*'],
}; 