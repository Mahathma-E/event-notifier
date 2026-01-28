'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'
import axios from 'axios'
import Cookies from 'js-cookie'
import { useRouter } from 'next/navigation'

interface User {
  id: number
  email: string
  name: string
  role: 'admin' | 'faculty' | 'student'
  department_id?: number
  year?: number
  section?: string
  department_name?: string
}

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (data: RegisterData) => Promise<void>
  logout: () => void
  updateUser: (user: User) => void
}

interface RegisterData {
  email: string
  password: string
  name: string
  role: 'admin' | 'faculty' | 'student'
  department_id?: number
  year?: number
  section?: string
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    const token = Cookies.get('token')
    if (!token) {
      setLoading(false)
      return
    }

    try {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
      const response = await axios.get(`${API_URL}/auth/me`)
      setUser(response.data.user)
    } catch (error) {
      Cookies.remove('token')
      delete axios.defaults.headers.common['Authorization']
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  const login = async (email: string, password: string) => {
    try {
      const response = await axios.post(`${API_URL}/auth/login`, {
        email,
        password,
      })

      const { token, user } = response.data
      Cookies.set('token', token, { expires: 7 })
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
      setUser(user)
      router.push('/dashboard')
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Login failed')
    }
  }

  const register = async (data: RegisterData) => {
    try {
      const response = await axios.post(`${API_URL}/auth/register`, data)

      const { token, user } = response.data
      Cookies.set('token', token, { expires: 7 })
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
      setUser(user)
      router.push('/dashboard')
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Registration failed')
    }
  }

  const logout = () => {
    Cookies.remove('token')
    delete axios.defaults.headers.common['Authorization']
    setUser(null)
    router.push('/login')
  }

  const updateUser = (updatedUser: User) => {
    setUser(updatedUser)
  }

  return (
    <AuthContext.Provider
      value={{ user, loading, login, register, logout, updateUser }}
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
