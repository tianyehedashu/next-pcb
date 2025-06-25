import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import type { User } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

/**
 * Get current user for server components (follows official docs)
 */
export async function getCurrentUser(): Promise<User | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

/**
 * Require authentication for pages (follows official docs pattern)
 * Always use supabase.auth.getUser() to protect pages and user data.
 * Never trust supabase.auth.getSession() inside server code.
 */
export async function requireAuth(options?: { 
  requireAdmin?: boolean; 
  redirectTo?: string 
}): Promise<User> {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  
  const { requireAdmin = false, redirectTo = '/auth' } = options || {}
  
  if (error || !user) {
    redirect(redirectTo)
  }
  
  if (requireAdmin && user.user_metadata?.role !== 'admin') {
    redirect('/auth?error=unauthorized')
  }
  
  return user
}

/**
 * Check authentication for API routes (follows official docs pattern)
 */
export async function checkUserAuth(): Promise<{
  user: User | null;
  error: NextResponse | null;
}> {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return {
      user: null,
      error: NextResponse.json(
        { error: 'Unauthorized: User not authenticated' },
        { status: 401 }
      )
    }
  }

  return { user, error: null }
}

/**
 * Check admin authentication for API routes (follows official docs pattern)
 */
export async function checkAdminAuth(): Promise<{
  user: User | null;
  error: NextResponse | null;
}> {
  const { user, error: userError } = await checkUserAuth()
  
  if (userError) {
    return { user: null, error: userError }
  }

  // Check role from JWT user_metadata (from database trigger)
  if (user?.user_metadata?.role !== 'admin') {
    return {
      user: null,
      error: NextResponse.json(
        { error: 'Forbidden: User is not an admin' },
        { status: 403 }
      )
    }
  }

  return { user, error: null }
}

/**
 * Check if user is admin (utility function)
 */
export function isAdmin(user: User | null): boolean {
  return !!(user && user.user_metadata?.role === 'admin')
} 