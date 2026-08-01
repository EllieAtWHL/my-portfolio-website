'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/Button'

export default function ProfilePage() {
  const [user, setUser] = useState<{ email: string } | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()
  const adminEmail = process.env.ADMIN_EMAIL

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUser({ email: user.email! })
      } else {
        router.push('/spurs-women/login')
      }
      setLoading(false)
    }
    fetchUser()
  }, [supabase, router])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/spurs-women/login')
  }

  if (loading) {
    return (
      <div className="flex-grow flex items-center justify-center p-4">
        <div className="text-gray-300">Loading...</div>
      </div>
    )
  }

  const isAdmin = adminEmail && user?.email === adminEmail

  return (
    <div className="flex-grow p-4">
      <div className="max-w-4xl mx-auto">
        <div className="spurs-accent-card rounded-lg p-8">
          <div className="flex justify-between items-center mb-6">
            <h1 className="spurs-text font-bold">Profile</h1>
            <Button
              variant="spurs"
              onClick={handleLogout}
            >
              Sign Out
            </Button>
          </div>

          {user && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-300">Email</label>
                <div className="p-3 bg-gray-700 rounded text-white">
                  {user.email}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-gray-300">Role</label>
                <div className="p-3 bg-gray-700 rounded text-white">
                  {isAdmin ? 'Admin' : 'User'}
                </div>
              </div>

              {isAdmin && (
                <div className="pt-4 border-t border-gray-600">
                  <h2 className="spurs-text font-semibold mb-4">Admin Access</h2>
                  <Button variant="spurs" asChild>
                    <Link href="/spurs-women/admin">
                      Go to Admin Panel
                    </Link>
                  </Button>
                </div>
              )}

              <div className="pt-4 border-t border-gray-600">
                <h2 className="spurs-text font-semibold mb-4">Account Settings</h2>
                <p className="text-gray-400 text-sm">
                  More profile features coming soon...
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
