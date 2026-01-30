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

  // Pagination & Filtering State
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [totalPages, setTotalPages] = useState(1)
  const [totalUsers, setTotalUsers] = useState(0)

  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'admin')) {
      router.push('/dashboard')
    }
  }, [user, authLoading, router])

  useEffect(() => {
    if (user && user.role === 'admin') {
      const delayDebounceFn = setTimeout(() => {
        fetchUsers()
      }, 500) // Debounce search

      return () => clearTimeout(delayDebounceFn)
    }
  }, [user, page, limit, search, roleFilter])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const token = Cookies.get('token')
      if (token) {
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
      }

      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        search,
        role: roleFilter
      })

      const response = await axios.get(`${API_URL}/users?${params}`)
      setUsers(response.data.users)
      setTotalPages(response.data.meta.totalPages)
      setTotalUsers(response.data.meta.total)
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
      // Reuse fetch to refresh list correctly with pagination
      fetchUsers()
    } catch (error) {
      console.error('Failed to delete user:', error)
      alert('Failed to delete user')
    }
  }

  const handlePageChange = (newPage: number) => {
    if (newPage > 0 && newPage <= totalPages) {
      setPage(newPage)
    }
  }

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value)
    setPage(1) // Reset to page 1 on search
  }

  const handleRoleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setRoleFilter(e.target.value)
    setPage(1) // Reset to page 1 on filter
  }

  const handleLimitChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setLimit(parseInt(e.target.value))
    setPage(1) // Reset to page 1 on page size change
  }

  if (authLoading) {
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
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h1 className="text-3xl font-bold text-white">User Management</h1>
          <div className="text-[#71767b] text-sm">
            Total Users: <span className="text-white font-bold">{totalUsers}</span>
          </div>
        </div>

        {/* Controls Bar */}
        <div className="bg-[#16181c] p-4 rounded-xl border border-dark-border flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="flex gap-4 w-full md:w-auto">
            {/* Search */}
            <input
              type="text"
              placeholder="Search users..."
              value={search}
              onChange={handleSearchChange}
              className="bg-black border border-dark-border rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary-500 w-full md:w-64"
            />

            {/* Role Filter */}
            <select
              value={roleFilter}
              onChange={handleRoleChange}
              className="bg-black border border-dark-border rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary-500"
            >
              <option value="">All Roles</option>
              <option value="student">Student</option>
              <option value="faculty">Faculty</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto justify-end">
            <span className="text-[#71767b] text-sm whitespace-nowrap">Rows per page:</span>
            <select
              value={limit}
              onChange={handleLimitChange}
              className="bg-black border border-dark-border rounded-lg px-2 py-2 text-white focus:outline-none focus:border-primary-500 text-sm"
            >
              <option value="10">10</option>
              <option value="25">25</option>
              <option value="50">50</option>
              <option value="100">100</option>
            </select>
          </div>
        </div>

        {/* Table Container */}
        <div className="bg-[#16181c] rounded-xl border border-dark-border overflow-hidden shadow-sm flex flex-col min-h-[500px]">
          <div className="overflow-x-auto">
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-500"></div>
              </div>
            ) : (
              <table className="w-full">
                <thead className="bg-black/20 border-b border-dark-border">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-bold text-[#71767b] uppercase tracking-wider">Name</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-[#71767b] uppercase tracking-wider">Email</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-[#71767b] uppercase tracking-wider">Role</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-[#71767b] uppercase tracking-wider">Department</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-[#71767b] uppercase tracking-wider">Year</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-[#71767b] uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-dark-border">
                  {users.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-8 text-center text-[#71767b]">
                        No users found matching your criteria.
                      </td>
                    </tr>
                  ) : (
                    users.map((user) => (
                      <tr key={user.id} className="hover:bg-[#202327] transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-white">{user.name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-[#71767b]">{user.email}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2.5 py-0.5 text-xs font-bold rounded border uppercase tracking-wide ${user.role === 'admin' ? 'bg-purple-500/10 text-purple-500 border-purple-500/20' :
                              user.role === 'faculty' ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' :
                                'bg-green-500/10 text-green-500 border-green-500/20'
                            }`}>
                            {user.role}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-[#71767b]">{user.department_name || '-'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-[#71767b]">{user.year ? `Year ${user.year}` : '-'}</td>
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
                    ))
                  )}
                </tbody>
              </table>
            )}
          </div>

          {/* Pagination Footer */}
          <div className="mt-auto border-t border-dark-border bg-black/20 p-4 flex items-center justify-between">
            <div className="text-sm text-[#71767b]">
              Showing page <span className="font-bold text-white">{page}</span> of <span className="font-bold text-white">{totalPages}</span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => handlePageChange(page - 1)}
                disabled={page === 1 || loading}
                className="px-4 py-2 rounded-lg bg-[#202327] text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#2c3035] transition-colors text-sm font-bold"
              >
                Previous
              </button>
              <button
                onClick={() => handlePageChange(page + 1)}
                disabled={page === totalPages || totalPages === 0 || loading}
                className="px-4 py-2 rounded-lg bg-[#202327] text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#2c3035] transition-colors text-sm font-bold"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}
