import { create } from "zustand";
import { supabase } from "@/lib/supabaseClient";
import { useEffect } from "react";
import type { Session } from "@supabase/supabase-js";

export type UserRole = "admin" | "user" | "guest";

export interface UserInfo {
  id: string;
  email?: string;
  full_name?: string;
  avatar_url?: string;
  status?: string;
  role?: UserRole;
  company_name?: string;
  phone?: string;
  address?: string;
  last_login?: string;
  [key: string]: unknown;
}

const rolePermissions: Record<UserRole, string[]> = {
  admin: ["read", "write", "delete", "manage_users", "view_analytics"],
  user: ["read", "write"],
  guest: ["read"],
};

interface UserState {
  user: UserInfo | null;
  session: Session | null;
  accessToken: string | null;
  isLoading: boolean;
  isAdmin: () => boolean;
  hasPermission: (permission: string) => boolean;
}

export const useUserStore = create<UserState>((set, get) => ({
  user: null,
  session: null,
  accessToken: null,
  isLoading: true,
  isAdmin: () => get().user?.role === "admin",
  hasPermission: (permission: string) => {
    const role = get().user?.role;
    return role ? rolePermissions[role]?.includes(permission) : false;
  },
}));

/**
 * SSR 场景下初始化 userStore。
 * 在 getServerSideProps/getInitialProps 等服务端逻辑中调用。
 * @param user UserInfo
 * @param session Session
 */
export function setUserFromSSR(user: UserInfo, session: Session) {
  useUserStore.setState({
    user,
    session,
    accessToken: session.access_token,
    isLoading: false,
  });
}

// 桥接 Supabase 状态到全局 store（客户端专用）
export function useBridgeUser() {
  const setUser = useUserStore.setState;

  useEffect(() => {
    const sync = async (session: Session | null) => {
      setUser({ isLoading: true });
      
      if (session?.user) {
        // 只在有 user 时拉 profile，合并 user_metadata
   
        const userMetaRole = session.user.user_metadata?.role;
           const mergedUser: UserInfo = {
          id: session.user.id,
          email: session.user.email,
          ...session.user.user_metadata,
          role: userMetaRole,
        };
        setUser({
          user: mergedUser,
          session,
          accessToken: session.access_token,
          isLoading: false,
        });
      } else {
        setUser({
          user: null,
          session: null,
          accessToken: null,
          isLoading: false,
        });
      }
    };

    // 首次同步
    supabase.auth.getSession().then(({ data: { session } }) => {
      sync(session);
    });

    // 监听 session 变化
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      sync(session);
    });

    const unsub = () => listener.subscription.unsubscribe();

    return () => {
      unsub();
    };
  }, [setUser]);
}

/**
 * 安全登出：清除 Supabase session、userStore，并可选跳转
 * @param redirect 跳转地址（如 "/auth?redirect=..."），不传则不跳转
 */
export async function logoutAndRedirect(redirect?: string) {
  await supabase.auth.signOut();
  useUserStore.setState({ user: null, session: null, accessToken: null, isLoading: false });
  if (redirect) {
    window.location.replace(redirect);
  }
} 