'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/Button'

export default function UnauthorisedPage() {
  const router = useRouter()
  const supabase = createClient()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/spurs-women/login')
  }

  return (
    <div className="flex items-center justify-center p-4">
      <div className="spurs-accent-card rounded-lg p-8 max-w-md w-full text-center">
        <h1 className="spurs-text text-3xl font-bold mb-4">Access Denied</h1>
        
        <div className="text-6xl mb-6">🔒</div>
        
        <p className="text-gray-300 mb-6">
          You don&apos;t have permission to access the admin panel. Only authorized administrators can access this page.
        </p>

        <div className="grid grid-cols-2 gap-3 pt-4 border-t border-gray-600 w-full">
          <Button
            variant="spurs"
            onClick={handleLogout}
          >
            Sign Out
          </Button>

          <Button
            variant="spurs"
            onClick={() => router.push('/spurs-women')}
          >
            Return to Home
          </Button>
        </div>
      </div>
    </div>
  )
}
