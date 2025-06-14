import { User } from '@supabase/supabase-js';

export type AdminUser = User & {
  banned_until?: string;
}; 