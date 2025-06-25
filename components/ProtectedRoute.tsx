'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'

interface ProtectedRouteProps {
  children: React.ReactNode
  requireAdmin?: boolean
  redirectTo?: string
}

export function ProtectedRoute({ 
  children, 
  requireAdmin = false, 
  redirectTo = '/auth' 
}: ProtectedRouteProps) {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (loading) return

    if (!user) {
      // 保存当前路径以便登录后跳转回来
      const currentPath = window.location.pathname + window.location.search
      router.push(`${redirectTo}?redirect=${encodeURIComponent(currentPath)}`)
      return
    }

    if (requireAdmin && user.user_metadata?.role !== 'admin') {
      router.push('/unauthorized')
      return
    }
  }, [user, loading, requireAdmin, redirectTo, router])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  if (requireAdmin && user.user_metadata?.role !== 'admin') {
    return null
  }

  return <>{children}</>
} 