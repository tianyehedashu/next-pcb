import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req: request, res });

  // 获取 session
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user;

  // 只允许管理员访问 /admin 页面和 API
  if (
    (request.nextUrl.pathname.startsWith('/admin') || request.nextUrl.pathname.startsWith('/api/admin'))
  ) {
    // 未登录或不是管理员
    if (!user || user.user_metadata?.role !== 'admin') {
      console.log('user', user);
      const loginUrl = new URL('/auth', request.url);
      loginUrl.searchParams.set('redirect', request.nextUrl.pathname + request.nextUrl.search);
      return NextResponse.redirect(loginUrl);
    }
  }
  return res;
}

export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*'],
}; 