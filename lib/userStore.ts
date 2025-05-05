import { create } from "zustand";
import { persist } from "zustand/middleware";
import { supabase } from "@/lib/supabaseClient";

export type UserRole = "admin" | "user" | "guest";

export interface UserInfo {
  id: string;
  email?: string;
  avatar_url?: string;
  status?: string;
  role?: UserRole;
  company_name?: string;
  phone?: string;
  address?: string;
  last_login?: string;
  [key: string]: any;
}

const rolePermissions: Record<UserRole, string[]> = {
  admin: ["read", "write", "delete", "manage_users", "view_analytics"],
  user: ["read", "write"],
  guest: ["read"],
};

interface UserState {
  user: UserInfo | null;
  setUser: (user: UserInfo | null) => void;
  clearUser: () => void;
  fetchUser: () => Promise<void>;
  isAdmin: () => boolean;
  hasPermission: (permission: string) => boolean;
}

export const useUserStore = create(
  persist<UserState>(
    (set, get) => ({
      user: null,
      setUser: (user) => set({ user }),
      clearUser: () => set({ user: null }),
      fetchUser: async () => {
        const { data: { user: supaUser } } = await supabase.auth.getUser();
        console.log('[userStore] supaUser:', supaUser);
        if (supaUser) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", supaUser.id)
            .maybeSingle();
          console.log('[userStore] user_metadata:', supaUser.user_metadata);
          console.log('[userStore] profile:', profile);
          const userMetaRole = supaUser.user_metadata?.role;
          const { role: _profileRole, ...profileRest } = profile || {};
          const mergedUser = { id: supaUser.id, email: supaUser.email, ...supaUser.user_metadata, ...profileRest, role: userMetaRole };
          console.log('[userStore] mergedUser:', mergedUser);
          set({ user: mergedUser });
        } else {
          set({ user: null });
        }
      },
      isAdmin: () => get().user?.role === "admin",
      hasPermission: (permission: string) => {
        const role = get().user?.role;
        return role ? rolePermissions[role]?.includes(permission) : false;
      },
    }),
    { name: "user-store" }
  )
); 