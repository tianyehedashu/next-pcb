import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useUserStore } from "@/lib/userStore";
import { supabase } from "@/lib/supabaseClient";
import type { Session } from "@supabase/supabase-js";

/**
 * 自动检测未登录并跳转到登录页（带redirect参数），可直接在页面/组件中调用。
 * user为null或undefined都跳转，统一用router.replace。
 */
export function useEnsureLogin() {
  const router = useRouter();
  const user = useUserStore(state => state.user);
  useEffect(() => {
    if (!user) {
      if (typeof window !== "undefined") {
        // 只取 pathname + search + hash，避免全路径导致跳转异常
        const path = window.location.pathname + window.location.search + window.location.hash;
        router.replace(`/auth?redirect=${encodeURIComponent(path)}`);
      } else {
        router.replace("/auth");
      }
    }
  }, [user, router]);
}

/**
 * 获取 Supabase session 的工具函数，包含错误处理和重试机制
 * @returns Promise<Session | null>
 */
export async function getSupabaseSessionSafely(): Promise<Session | null> {
  try {
    const authResult = await supabase.auth.getSession();
    return authResult.data.session;
  } catch (fetchError) {
    console.error('Auth fetch failed:', fetchError);
    
    // 尝试使用 getUser 作为备用方案
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        return null;
      }
      
      // 如果可以获取用户但不能获取 session，创建一个简化的 session 对象
      return {
        user,
        access_token: '',
        refresh_token: '',
        expires_in: 0,
        expires_at: 0,
        token_type: 'bearer'
      } as Session;
    } catch (userError) {
      console.error('User fetch also failed:', userError);
      return null;
    }
  }
}

/**
 * 检查用户认证状态的工具函数
 * @param redirectPath 认证失败时重定向的路径，默认为 '/auth'
 * @returns Promise<Session | null> 返回 session 或 null（如果需要重定向）
 */
export async function checkAuthAndRedirect(redirectPath: string = '/auth'): Promise<Session | null> {
  const session = await getSupabaseSessionSafely();
  
  if (!session) {
    // 如果在浏览器环境中，执行重定向
    if (typeof window !== 'undefined') {
      const currentPath = window.location.pathname + window.location.search + window.location.hash;
      const redirectUrl = `${redirectPath}?redirect=${encodeURIComponent(currentPath)}`;
      window.location.replace(redirectUrl);
    }
    return null;
  }
  
  return session;
}

/**
 * 安全解析 fetch 响应为 JSON，防止 HTML 响应被误解析
 * @param response fetch 响应对象
 * @returns Promise<T> 解析后的 JSON 数据
 * @throws Error 如果响应不是 JSON 格式或解析失败
 */
export async function parseResponseSafely<T = unknown>(response: Response): Promise<T> {
  // 检查响应是否成功
  if (!response.ok) {
    let errorMessage = `Server error: ${response.status} ${response.statusText}`;
    
    try {
      // 检查是否是 JSON 错误响应
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const errorData = await response.json();
        errorMessage = errorData.error || errorData.message || errorMessage;
      }
    } catch {
      // 如果解析错误响应失败，使用默认错误消息
    }
    
    throw new Error(errorMessage);
  }
  
  // 检查响应内容类型
  const contentType = response.headers.get('content-type');
  if (!contentType || !contentType.includes('application/json')) {
    throw new Error('Invalid response format. Expected JSON but received HTML or other format.');
  }
  
  try {
    return await response.json();
  } catch {
    throw new Error('Failed to parse server response. The server may have returned corrupted data.');
  }
}

/**
 * 安全的 fetch 工具函数，包含重试机制和 JSON 解析
 * @param url 请求 URL
 * @param options fetch 选项
 * @param maxRetries 最大重试次数，默认为 3
 * @returns Promise<T> 解析后的 JSON 数据
 */
export async function fetchWithRetry<T = unknown>(
  url: string, 
  options: RequestInit = {}, 
  maxRetries: number = 3
): Promise<T> {
  let lastError: Error | null = null;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(url, options);
      return await parseResponseSafely<T>(response);
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown error');
      
      // 如果是最后一次尝试，或者是认证错误，直接抛出
      if (attempt === maxRetries || (error instanceof Error && error.message.includes('401'))) {
        throw lastError;
      }
      
      // 等待后重试（指数退避）
      await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
    }
  }
  
  throw lastError || new Error('All retry attempts failed');
} 