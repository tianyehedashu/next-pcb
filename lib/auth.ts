import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useUserStore } from "@/lib/userStore";

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