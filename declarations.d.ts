declare module '@supabase/gotrue-js' {
  export interface AdminUserAttributes extends Record<string, unknown> {
    banned_until?: string;
  }
}

declare module "*.json" {
  const value: unknown;
  export default value;
}

// Chatwoot 全局类型定义
declare global {
  interface Window {
    $chatwoot?: {
      toggle: (state?: 'open' | 'close') => void;
      toggleBubbleVisibility: (state: 'show' | 'hide') => void;
      setUser: (identifier: string, user: Record<string, unknown>) => void;
      setCustomAttributes: (attributes: Record<string, unknown>) => void;
      reset: () => void;
      isOpen?: () => boolean;
      close?: () => void;
      hideWidget?: () => void;
    };
    chatwootSDK?: {
      run: (config: Record<string, unknown>) => void;
    };
    chatwootSettings?: Record<string, unknown>;
    chatwootLoadPromise?: Promise<unknown>;
  }
} 