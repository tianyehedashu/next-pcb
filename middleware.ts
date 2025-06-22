import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import type { User } from '@supabase/supabase-js';

// ========== 路径权限配置 ==========
const PATH_CONFIG = {
  // 需要管理员权限的路径
  ADMIN_PATHS: ['/admin', '/api/admin'],
  // 需要登录权限的路径
  USER_PATHS: ['/profile', '/api/user'],
  // 公开访问的管理员API路径（例外）
  PUBLIC_ADMIN_API_PATHS: [
    '/api/admin/exchange-rates', // GET方法公开访问
  ],
} as const;

/**
 * 检查路径是否匹配指定的路径前缀列表
 */
function matchesPathPrefixes(pathname: string, pathPrefixes: readonly string[]): boolean {
  return pathPrefixes.some(prefix => pathname.startsWith(prefix));
}

/**
 * 检查是否为公开的管理员API路径
 */
function isPublicAdminAPI(pathname: string, method: string): boolean {
  // 只有GET方法的汇率查询API是公开的
  if (method !== 'GET') {
    return false;
  }
  
  return PATH_CONFIG.PUBLIC_ADMIN_API_PATHS.some(publicPath => {
    // 精确匹配或匹配带ID的路径
    return pathname === publicPath || 
           pathname.startsWith(publicPath + '/') ||
           // 匹配 /api/admin/exchange-rates/[id] 格式
           (publicPath === '/api/admin/exchange-rates' && 
            /^\/api\/admin\/exchange-rates\/\d+$/.test(pathname));
  });
}

/**
 * 创建重定向到登录页面的响应
 */
function createRedirectToAuth(request: NextRequest): NextResponse {
  const loginUrl = new URL('/auth', request.url);
  const fullPath = request.nextUrl.pathname + request.nextUrl.search;
  loginUrl.searchParams.set('redirect', fullPath);
  return NextResponse.redirect(loginUrl);
}

/**
 * 管理员权限中间件
 * 检查用户是否有管理员权限
 */
async function adminMiddleware(request: NextRequest, user: User | null): Promise<NextResponse | null> {
  const pathname = request.nextUrl.pathname;
  const method = request.method;
  
  // 检查是否为管理员路径
  if (!matchesPathPrefixes(pathname, PATH_CONFIG.ADMIN_PATHS)) {
    return null; // 不是管理员路径，跳过检查
  }
  
  // 检查是否为公开的管理员API（仅限GET方法的汇率查询）
  if (isPublicAdminAPI(pathname, method)) {
    return null; // 公开访问，跳过权限检查
  }
  
  // 管理员权限检查：必须登录 + 具有 admin 角色
  const isAdmin = user && user.user_metadata?.role === 'admin';
  if (!isAdmin) {
    return createRedirectToAuth(request);
  }
  
  return null; // 权限检查通过
}

/**
 * 用户登录中间件
 * 检查用户是否已登录
 */
async function userAuthMiddleware(request: NextRequest, user: User | null): Promise<NextResponse | null> {
  const pathname = request.nextUrl.pathname;
  
  // 检查是否为用户路径
  if (!matchesPathPrefixes(pathname, PATH_CONFIG.USER_PATHS)) {
    return null; // 不是用户路径，跳过检查
  }
  
  // 用户登录检查：只需要用户已登录即可
  if (!user) {
    return createRedirectToAuth(request);
  }
  
  return null; // 权限检查通过
}

export async function middleware(request: NextRequest) {
  const response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value);
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  // ========== 执行权限检查中间件链 ==========
  
  // 1. 管理员权限检查
  const adminResult = await adminMiddleware(request, user);
  if (adminResult) {
    return adminResult; // 权限不足，返回重定向
  }
  
  // 2. 用户登录检查
  const userAuthResult = await userAuthMiddleware(request, user);
  if (userAuthResult) {
    return userAuthResult; // 未登录，返回重定向
  }
  
  // 所有权限检查通过，继续请求
  return response;
}

// Next.js 要求静态配置，不能使用动态函数
export const config = {
  matcher: [
    '/admin/:path*',
    '/api/admin/:path*',
    '/profile/:path*',
    '/api/user/:path*',
  ],
}; 