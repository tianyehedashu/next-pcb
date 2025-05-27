import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useUserStore } from "@/lib/userStore";
import type { UserRole } from "@/lib/userStore";

/**
 * 页面需要特定角色时调用。返回权限状态，由页面决定如何处理。
 * @param roles 允许访问的角色（如 ["admin"]）
 * @param redirectPath 跳转后回到的页面路径（如 /quote/admin）
 */
export function useRequireRole(
  roles: UserRole[],
  redirectPath: string
): { isAllowed: boolean; isDenied: boolean; isLoading: boolean } {
  const user = useUserStore(state => state.user);
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isAllowed, setIsAllowed] = useState(false);
  const [isDenied, setIsDenied] = useState(false);

  useEffect(() => {
    if (user === null) {
      // 未登录，自动跳转登录页
      router.replace(`/auth?redirect=${encodeURIComponent(redirectPath)}`);
      setIsLoading(true);
      setIsAllowed(false);
      setIsDenied(false);
    } else if (user && !roles.includes(user.role as UserRole)) {
      // 已登录但角色不符
      setIsLoading(false);
      setIsAllowed(false);
      setIsDenied(true);
    } else if (user && roles.includes(user.role as UserRole)) {
      setIsLoading(false);
      setIsAllowed(true);
      setIsDenied(false);
    }
  }, [user, router, redirectPath, roles]);

  return { isAllowed, isDenied, isLoading };
} 