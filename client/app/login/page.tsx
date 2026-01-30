'use client'

import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { FcGoogle } from 'react-icons/fc'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login, loginWithGoogle } = useAuth()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      await login(email, password)
    } catch (err: any) {
      setError(err.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    setError('')
    setLoading(true)
    try {
      await loginWithGoogle()
    } catch (err: any) {
      setError(err.message || 'Google login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-black px-4 py-8">
      <div className="max-w-md w-full bg-[#16181c] rounded-xl border border-dark-border p-8 shadow-2xl">
        <div className="text-center mb-8">
          <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 overflow-hidden">
            <img src="/g-logo.png" alt="GCE Notify" className="w-full h-full object-cover scale-125" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">
            Sign in to GCE Notify
          </h1>
          <p className="text-[#71767b]">Intelligent Digital Notification Framework</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className={`px-4 py-3 rounded-lg border ${error.includes('verified') ? 'bg-blue-500/10 border-blue-500/20 text-blue-500' : 'bg-red-500/10 border-red-500/20 text-red-500'}`}>
              {error}
            </div>
          )}

          <div className="space-y-4">
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 px-4 py-2.5 bg-white text-black rounded-full hover:bg-gray-200 transition-colors disabled:opacity-50 font-bold"
            >
              <FcGoogle size={20} />
              <span className="font-bold">Sign in with Google</span>
            </button>

            <div className="relative flex items-center py-2">
              <div className="flex-grow border-t border-dark-border"></div>
              <span className="flex-shrink-0 mx-4 text-sm text-[#71767b]">or</span>
              <div className="flex-grow border-t border-dark-border"></div>
            </div>

            <div>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 bg-black border border-dark-border rounded-lg text-white focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-colors placeholder-[#71767b]"
                placeholder="Email address"
              />
            </div>

            <div>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-3 bg-black border border-dark-border rounded-lg text-white focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-colors placeholder-[#71767b]"
                placeholder="Password"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary-500 text-white py-2.5 px-4 rounded-full hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-black disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-bold shadow-lg shadow-primary-500/20"
          >
            {loading ? 'Processing...' : 'Next'}
          </button>
        </form>

        <div className="mt-8 text-center">
          <p className="text-sm text-[#71767b]">
            Don't have an account?{' '}
            <Link href="/register" className="text-primary-500 hover:text-primary-400 font-medium hover:underline">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
