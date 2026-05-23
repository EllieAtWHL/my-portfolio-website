'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function UnauthorizedPage() {
  const router = useRouter()
  const supabase = createClient()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <div className="spurs-wrapper min-h-screen flex items-center justify-center p-4">
      <div className="spurs-accent-card rounded-lg p-8 max-w-md w-full text-center">
        <h1 className="spurs-text text-3xl font-bold mb-4">Access Denied</h1>
        
        <div className="text-6xl mb-6">🔒</div>
        
        <p className="text-gray-300 mb-6">
          You don&apos;t have permission to access the admin panel. Only authorized administrators can access this page.
        </p>

        <button
          onClick={handleLogout}
          className="spurs-button w-full px-6 py-3 rounded font-medium mb-4"
        >
          Sign Out
        </button>

        <button
          onClick={() => router.push('/')}
          className="w-full px-6 py-3 rounded font-medium bg-gray-700 hover:bg-gray-600 text-white transition-colors"
        >
          Return to Home
        </button>
      </div>
    </div>
  )
}
