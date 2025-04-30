"use client";
import { createContext, useContext, useEffect, useState } from "react";
import { User, Session, AuthChangeEvent } from "@supabase/supabase-js";
import { createBrowserSupabaseClient } from "@supabase/auth-helpers-nextjs";

// 定义用户角色
export type UserRole = "admin" | "user" | "guest";

// 扩展用户信息接口
export interface ExtendedUser extends User {
  role?: UserRole;
  company_name?: string;
  phone?: string;
  address?: string;
  last_login?: Date;
}

// 用户上下文接口
interface UserContextType {
  user: ExtendedUser | null;
  isLoading: boolean;
  isAdmin: boolean;
  hasPermission: (permission: string) => boolean;
}

// 创建上下文
const UserContext = createContext<UserContextType>({
  user: null,
  isLoading: true,
  isAdmin: false,
  hasPermission: () => false,
});

// 权限映射
const rolePermissions: Record<UserRole, string[]> = {
  admin: ["read", "write", "delete", "manage_users", "view_analytics"],
  user: ["read", "write"],
  guest: ["read"],
};

export function UserProvider({ 
  children, 
  initialUser 
}: { 
  children: React.ReactNode;
  initialUser?: ExtendedUser | null;
}) {
  const [user, setUser] = useState<ExtendedUser | null>(initialUser ?? null);
  const [isLoading, setIsLoading] = useState(!initialUser);

  useEffect(() => {
    const supabase = createBrowserSupabaseClient();

    const { data: listener } = supabase.auth.onAuthStateChange(
      async (event: AuthChangeEvent, session: Session | null) => {
        if (session?.user) {
          // 获取扩展的用户信息
          const { data: profile } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", session.user.id)
            .single();

          // 合并用户信息
          const extendedUser: ExtendedUser = {
            ...session.user,
            role: profile?.role || "user",
            company_name: profile?.company_name,
            phone: profile?.phone,
            address: profile?.address,
            last_login: profile?.last_login,
          };

          setUser(extendedUser);
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

  // 检查用户是否为管理员
  const isAdmin = user?.role === "admin";

  // 检查用户是否具有特定权限
  const hasPermission = (permission: string): boolean => {
    if (!user?.role) return false;
    return rolePermissions[user.role].includes(permission);
  };

  return (
    <UserContext.Provider 
      value={{ 
        user, 
        isLoading,
        isAdmin,
        hasPermission,
      }}
    >
      {children}
    </UserContext.Provider>
  );
}

// 使用钩子
export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
} 