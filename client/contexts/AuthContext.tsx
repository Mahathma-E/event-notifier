'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'
import axios from 'axios'
import { useRouter } from 'next/navigation'
import { auth } from '@/lib/firebase'
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  getIdToken,
  GoogleAuthProvider,
  signInWithPopup,
  sendEmailVerification,
} from 'firebase/auth'
import Cookies from 'js-cookie'

interface User {
  id: number
  email: string
  name: string
  role: 'admin' | 'faculty' | 'student'
  department_id?: number
  year?: number
  department_name?: string
  designation?: string
  subjects?: string
}

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  loginWithGoogle: () => Promise<void>
  register: (data: RegisterData) => Promise<void>
  logout: () => void
  updateUser: (user: User) => void
  resendVerification: () => Promise<void>
  isEmailVerified: boolean
}

interface RegisterData {
  email: string
  password: string
  name: string
  role: 'admin' | 'faculty' | 'student'
  department_id?: number
  year?: number
  section?: string
  designation?: string
  subjects?: string
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [isEmailVerified, setIsEmailVerified] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setLoading(true)
      if (firebaseUser) {
        setIsEmailVerified(firebaseUser.emailVerified)

        if (firebaseUser.emailVerified) {
          try {
            const token = await getIdToken(firebaseUser)
            Cookies.set('token', token, { expires: 7 })
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
            const response = await axios.get(`${API_URL}/auth/me`)
            setUser(response.data.user)
          } catch (error: any) {
            console.error('Failed to sync user with backend:', error)
            // If user doesn't exist in our DB yet (common for new Google users)
            if (error.response?.status === 404 || error.response?.status === 401) {
              setUser(null)
            } else {
              await signOut(auth)
            }
          }
        } else {
          setUser(null)
          // Optionally notify user to verify email
        }
      } else {
        setUser(null)
        setIsEmailVerified(false)
        delete axios.defaults.headers.common['Authorization']
      }
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  const login = async (email: string, password: string) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password)

      if (!userCredential.user.emailVerified) {
        await sendEmailVerification(userCredential.user)
        throw new Error('Email not verified. A verification link has been sent to your inbox.')
      }

      const token = await getIdToken(userCredential.user)
      Cookies.set('token', token, { expires: 7 })
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`

      const response = await axios.get(`${API_URL}/auth/me`)
      setUser(response.data.user)
      router.push('/dashboard')
    } catch (error: any) {
      if (error.code === 'auth/user-not-verified') {
        throw new Error('Email not verified. Please check your inbox.')
      }
      throw new Error(error.message || 'Login failed')
    }
  }

  const loginWithGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider()
      const userCredential = await signInWithPopup(auth, provider)

      // Google users are usually already verified, but let's check
      setIsEmailVerified(userCredential.user.emailVerified)

      const token = await getIdToken(userCredential.user)
      Cookies.set('token', token, { expires: 7 })
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`

      try {
        const response = await axios.get(`${API_URL}/auth/me`)
        setUser(response.data.user)
        router.push('/dashboard')
      } catch (error: any) {
        // If user not in DB, redirect to register to complete profile
        if (error.response?.status === 404 || error.response?.status === 401) {
          router.push('/register?complete_profile=true')
        } else {
          throw error
        }
      }
    } catch (error: any) {
      throw new Error(error.message || 'Google Login failed')
    }
  }

  const register = async (data: RegisterData) => {
    try {
      // 1. Create user in Firebase
      const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password)

      // 2. Send Email Verification
      await sendEmailVerification(userCredential.user)

      // 3. Create profile in PostgreSQL
      const response = await axios.post(`${API_URL}/auth/register`, {
        ...data,
        firebase_uid: userCredential.user.uid
      })

      // We don't log in yet because email is not verified
      await signOut(auth)
      setUser(null)
      throw new Error('Registration successful! Please check your email to verify your account before logging in.')
    } catch (error: any) {
      throw new Error(error.message || 'Registration failed')
    }
  }

  const resendVerification = async () => {
    if (auth.currentUser) {
      await sendEmailVerification(auth.currentUser)
    }
  }

  const logout = async () => {
    try {
      await signOut(auth)
      setUser(null)
      Cookies.remove('token')
      delete axios.defaults.headers.common['Authorization']
      router.push('/login')
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }

  const updateUser = (updatedUser: User) => {
    setUser(updatedUser)
  }

  return (
    <AuthContext.Provider
      value={{ user, loading, login, loginWithGoogle, register, logout, updateUser, resendVerification, isEmailVerified }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
