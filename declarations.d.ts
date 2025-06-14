import { AdminUserAttributes } from '@supabase/gotrue-js';

declare module '@supabase/gotrue-js' {
  export interface AdminUserAttributes extends Record<string, any> {
    banned_until?: string;
  }
}

declare module "*.json" {
  const value: any;
  export default value;
} 