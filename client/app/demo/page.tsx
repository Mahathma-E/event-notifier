'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'

export default function DemoPage() {
  const router = useRouter()
  const { updateUser, user } = useAuth()

  useEffect(() => {
    // Set demo mode first
    if (typeof window !== 'undefined') {
      localStorage.setItem('demo_mode', 'true')
      
      // Set demo user
      updateUser({
        id: 0,
        email: 'demo@gce.edu',
        name: 'Demo User',
        role: 'admin',
      })
      
      // Small delay to ensure state is set
      setTimeout(() => {
        router.push('/dashboard')
      }, 100)
    }
  }, [router, updateUser])

  // If user is already set, redirect immediately
  useEffect(() => {
    if (user) {
      router.push('/dashboard')
    }
  }, [user, router])

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading demo mode...</p>
      </div>
    </div>
  )
}
