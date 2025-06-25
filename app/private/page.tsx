import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'

export default async function PrivatePage() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    redirect('/auth')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">
          Welcome to Protected Page
        </h1>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            User Information
          </h2>
          
          <div className="space-y-3">
            <div>
              <span className="font-medium text-gray-600">Email:</span>
              <span className="ml-2 text-gray-900">{user.email}</span>
            </div>
            
            <div>
              <span className="font-medium text-gray-600">User ID:</span>
              <span className="ml-2 text-gray-900 font-mono text-sm">{user.id}</span>
            </div>
            
            <div>
              <span className="font-medium text-gray-600">Role:</span>
              <span className="ml-2 text-gray-900">
                {user.user_metadata?.role || 'user'}
              </span>
            </div>
            
            <div>
              <span className="font-medium text-gray-600">Logged in since:</span>
              <span className="ml-2 text-gray-900">
                {new Date(user.created_at).toLocaleString()}
              </span>
            </div>
          </div>
        </div>
        
        <div className="mt-6 flex gap-4">
          <a 
            href="/auth" 
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors"
          >
            Back to Auth
          </a>
          
          {user.user_metadata?.role === 'admin' && (
            <a 
              href="/admin" 
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md transition-colors"
            >
              Admin Dashboard
            </a>
          )}
          
          <a 
            href="/profile" 
            className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md transition-colors"
          >
            Profile
          </a>
        </div>
        
        <div className="mt-8 bg-green-50 border border-green-200 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-green-800 mb-2">
            ✅ Authentication Working!
          </h3>
          <p className="text-green-700">
            This page uses the official Supabase Next.js SSR authentication pattern.
            The protection is handled at the page level using <code>supabase.auth.getUser()</code>.
          </p>
        </div>
      </div>
    </div>
  )
} 