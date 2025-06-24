import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

/**
 * Creates a Supabase client for server-side operations that represents the
 * currently logged-in user. It reads the user's session from cookies and 
 * uses the recommended `getAll` and `setAll` methods.
 * This client respects RLS policies.
 */
export async function createSupabaseServerClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            // Forward all cookie changes to the browser
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  );
}

/**
 * Creates a Supabase client for server-side admin operations.
 * This client uses the SERVICE_ROLE_KEY and bypasses all RLS policies.
 * It provides a no-op cookie implementation to satisfy the type requirements.
 * Use with extreme caution.
 */
export function createSupabaseAdminClient() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        // A no-op implementation for the admin client, which does not handle user sessions.
        getAll() {
          return [];
        },
        setAll() {
          // No-op
        },
      },
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
} 