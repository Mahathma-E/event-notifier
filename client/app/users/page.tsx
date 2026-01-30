'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import Layout from '@/components/Layout'
import axios from 'axios'
import Cookies from 'js-cookie'
import { FiTrash2, FiEdit } from 'react-icons/fi'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'

interface User {
  id: number
  email: string
  name: string
  role: string
  department_id?: number
  department_name?: string
  year?: number
  created_at: string
}

export default function UsersPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'admin')) {
      router.push('/dashboard')
    }
  }, [user, authLoading, router])

  useEffect(() => {
    if (user && user.role === 'admin') {
      fetchUsers()
    }
  }, [user])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const token = Cookies.get('token')
      if (token) {
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
      }

      const response = await axios.get(`${API_URL}/users`)
      setUsers(response.data.users)
    } catch (error) {
      console.error('Failed to fetch users:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (userId: number) => {
    if (!confirm('Are you sure you want to delete this user?')) {
      return
    }

    try {
      const token = Cookies.get('token')
      if (token) {
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
      }

      await axios.delete(`${API_URL}/users/${userId}`)
      setUsers(users.filter((u) => u.id !== userId))
    } catch (error) {
      console.error('Failed to delete user:', error)
      alert('Failed to delete user')
    }
  }

  if (authLoading || loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[40vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-white">User Management</h1>
        </div>

        <div className="bg-[#16181c] rounded-xl border border-dark-border overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-black/20 border-b border-dark-border">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-[#71767b] uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-[#71767b] uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-[#71767b] uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-[#71767b] uppercase tracking-wider">
                    Department
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-[#71767b] uppercase tracking-wider">
                    Year
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-[#71767b] uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-border">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-[#202327] transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-white">
                      {user.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-[#71767b]">
                      {user.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2.5 py-0.5 text-xs font-bold rounded border uppercase tracking-wide ${user.role === 'admin'
                            ? 'bg-purple-500/10 text-purple-500 border-purple-500/20'
                            : user.role === 'faculty'
                              ? 'bg-blue-500/10 text-blue-500 border-blue-500/20'
                              : 'bg-green-500/10 text-green-500 border-green-500/20'
                          }`}
                      >
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-[#71767b]">
                      {user.department_name || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-[#71767b]">
                      {user.year ? `Year ${user.year}` : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => router.push(`/users/${user.id}/edit`)}
                          className="text-[#71767b] hover:text-primary-500 p-2 hover:bg-primary-500/10 rounded-full transition-colors"
                          title="Edit User"
                        >
                          <FiEdit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(user.id)}
                          className="text-[#71767b] hover:text-red-500 p-2 hover:bg-red-500/10 rounded-full transition-colors"
                          title="Delete User"
                        >
                          <FiTrash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Layout>
  )
}
