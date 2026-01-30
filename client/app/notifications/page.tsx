'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import Layout from '@/components/Layout'
import axios from 'axios'
import Cookies from 'js-cookie'
import { FiSearch, FiFilter, FiX, FiBell, FiCheckCircle, FiAlertCircle, FiInfo, FiTrendingUp } from 'react-icons/fi'
import { format } from 'date-fns'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'

interface Notification {
  id: number
  title: string
  content: string
  category: string
  priority: string
  created_at: string
  is_pinned: boolean
  is_read: boolean
  read_count: number
  acknowledged_count: number
  created_by_name: string
  department_name?: string
  attachment_url?: string
  attachment_type?: string
}



export default function NotificationsPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filters, setFilters] = useState({
    category: '',
    priority: '',
  })
  const [showFilters, setShowFilters] = useState(false)
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(20)
  const [totalPages, setTotalPages] = useState(1)



  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
    }
  }, [user, authLoading, router])

  useEffect(() => {
    if (user) {
      fetchNotifications()
    }
  }, [user, page, limit, search, filters])

  const fetchNotifications = async () => {
    try {
      setLoading(true)
      const token = Cookies.get('token')
      if (token) {
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
      }

      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      })

      if (search) params.append('search', search)
      if (filters.category) params.append('category', filters.category)
      if (filters.priority) params.append('priority', filters.priority)

      const response = await axios.get(`${API_URL}/notifications?${params.toString()}`)
      setNotifications(response.data.notifications)
      setTotalPages(response.data.pagination.pages)
    } catch (error) {
      console.error('Failed to fetch notifications:', error)
    } finally {
      setLoading(false)
    }
  }



  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Emergency':
        return 'bg-red-500/10 text-red-500 border-red-500/20'
      case 'High':
        return 'bg-orange-500/10 text-orange-500 border-orange-500/20'
      case 'Normal':
        return 'bg-blue-500/10 text-blue-500 border-blue-500/20'
      case 'Info':
        return 'bg-gray-500/10 text-gray-400 border-gray-500/20'
      default:
        return 'bg-gray-500/10 text-gray-400 border-gray-500/20'
    }
  }

  const clearFilters = () => {
    setFilters({ category: '', priority: '' })
    setSearch('')
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Emergency':
        return <FiAlertCircle className="w-5 h-5 text-red-500" />
      case 'Exam':
        return <FiCheckCircle className="w-5 h-5 text-green-500" />
      default:
        return <FiInfo className="w-5 h-5 text-blue-500" />
    }
  }

  if (authLoading || (loading && notifications.length === 0)) {
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
      <div className="max-w-[1600px] mx-auto p-4 sm:p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h1 className="text-3xl font-bold text-white tracking-tight">Notifications</h1>
          {(user?.role === 'admin' || user?.role === 'faculty') && (
            <button
              onClick={() => router.push('/notifications/create')}
              className="bg-primary-500 text-white px-6 py-2.5 rounded-full font-bold hover:bg-primary-600 transition-colors shadow-lg shadow-primary-500/20"
            >
              Create Notification
            </button>
          )}
        </div>

        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative group">
              <FiSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-[#71767b] group-focus-within:text-primary-500 transition-colors" />
              <input
                type="text"
                placeholder="Search notifications..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-12 pr-4 py-2.5 bg-[#16181c] border border-dark-border rounded-full text-white placeholder-[#71767b] focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500 transition-all text-sm"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center justify-center space-x-2 px-5 py-2.5 border rounded-full font-bold transition-all text-sm ${showFilters ? 'bg-primary-500/10 border-primary-500 text-primary-500' : 'bg-transparent border-dark-border text-[#71767b] hover:bg-[#16181c] hover:text-white'}`}
            >
              <FiFilter className="w-4 h-4" />
              <span>Filters</span>
            </button>
          </div>

          {showFilters && (
            <div className="bg-[#16181c] rounded-2xl p-6 border border-dark-border animate-fade-in-down">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-[#71767b] mb-2 uppercase tracking-wide">
                    Category
                  </label>
                  <select
                    value={filters.category}
                    onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                    className="w-full px-4 py-2.5 bg-black border border-dark-border rounded-lg text-white focus:outline-none focus:border-primary-500 transition-colors"
                  >
                    <option value="">All Categories</option>
                    <option value="Academic">Academic</option>
                    <option value="Exam">Exam</option>
                    <option value="Placement">Placement</option>
                    <option value="Events">Events</option>
                    <option value="Administrative">Administrative</option>
                    <option value="Emergency">Emergency</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-[#71767b] mb-2 uppercase tracking-wide">
                    Priority
                  </label>
                  <select
                    value={filters.priority}
                    onChange={(e) => setFilters({ ...filters, priority: e.target.value })}
                    className="w-full px-4 py-2.5 bg-black border border-dark-border rounded-lg text-white focus:outline-none focus:border-primary-500 transition-colors"
                  >
                    <option value="">All Priorities</option>
                    <option value="Emergency">Emergency</option>
                    <option value="High">High</option>
                    <option value="Normal">Normal</option>
                    <option value="Info">Info</option>
                  </select>
                </div>
              </div>
              {(filters.category || filters.priority || search) && (
                <div className="flex justify-end mt-4">
                  <button
                    onClick={clearFilters}
                    className="flex items-center space-x-2 text-sm font-bold text-red-500 hover:text-red-400 transition-colors"
                  >
                    <FiX />
                    <span>Clear filters</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Notifications Grid - Changed to Grid Layout */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {notifications.length === 0 ? (
            <div className="col-span-full text-center py-20">
              <div className="w-20 h-20 bg-[#16181c] rounded-full flex items-center justify-center mx-auto mb-6">
                <FiBell className="w-10 h-10 text-[#71767b]" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">No notifications found</h3>
              <p className="text-[#71767b]">Try adjusting your filters or search terms.</p>
            </div>
          ) : (
            notifications.map((notification) => (
              <div
                key={notification.id}
                className={`bg-[#16181c] rounded-xl border border-dark-border p-4 hover:bg-[#202327] transition-all cursor-pointer group relative overflow-hidden ${!notification.is_read ? 'bg-[#1a1d21]' : ''}`}
                onClick={() => router.push(`/notifications/${notification.id}`)}
              >
                {/* Unread Indicator */}
                {!notification.is_read && (
                  <div className="absolute top-6 right-6 w-2.5 h-2.5 bg-primary-500 rounded-full shadow-[0_0_8px_rgba(29,155,240,0.5)]"></div>
                )}

                <div className="flex items-start gap-4 pr-6">
                  <div className="flex-shrink-0 pt-1">
                    <div className="w-10 h-10 rounded-full bg-[#2f3336]/50 flex items-center justify-center border border-dark-border">
                      {getCategoryIcon(notification.category)}
                    </div>
                  </div>

                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-3">
                      {notification.is_pinned && (
                        <span className="text-[10px] font-bold text-yellow-500 bg-yellow-500/10 px-2 py-0.5 rounded border border-yellow-500/20 uppercase tracking-wide">
                          PINNED
                        </span>
                      )}
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase tracking-wide ${getPriorityColor(
                          notification.priority
                        )}`}
                      >
                        {notification.priority}
                      </span>
                      <span className="text-[10px] font-bold text-[#71767b] bg-[#2f3336] px-2 py-0.5 rounded border border-dark-border uppercase tracking-wide">
                        {notification.category}
                      </span>
                    </div>

                    <h3 className="text-xl font-bold text-white mb-2 group-hover:underline decoration-primary-500 underline-offset-4">
                      {notification.title}
                    </h3>

                    <p className="text-[#dbebec] mb-3 line-clamp-2 md:line-clamp-3 leading-relaxed text-[15px] font-light">
                      {notification.content}
                    </p>

                    <div className="flex flex-wrap items-center gap-y-2 gap-x-4 text-xs font-medium text-[#71767b]">
                      <div className="flex items-center gap-1.5">
                        <div className="w-5 h-5 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white text-[10px] font-bold">
                          {notification.created_by_name.charAt(0)}
                        </div>
                        <span className="text-white">{notification.created_by_name}</span>
                      </div>
                      {notification.department_name && (
                        <span>• {notification.department_name}</span>
                      )}
                      <span>• {format(new Date(notification.created_at), 'MMM d, yyyy h:mm a')}</span>
                      {(notification.read_count > 0 || notification.acknowledged_count > 0) && (
                        <span className="hidden sm:inline">•</span>
                      )}
                      {notification.read_count > 0 && (
                        <span className="bg-[#2f3336]/40 px-1.5 py-0.5 rounded">{notification.read_count} read</span>
                      )}
                      {notification.acknowledged_count > 0 && (
                        <span className="text-green-500 bg-green-500/10 px-1.5 py-0.5 rounded">{notification.acknowledged_count} acknowledged</span>
                      )}
                    </div>

                    {notification.attachment_url && (
                      <div className="mt-4">
                        <a
                          href={`${API_URL.replace('/api', '')}${notification.attachment_url}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center text-xs text-primary-500 hover:text-primary-400 font-bold bg-primary-500/10 px-3 py-1.5 rounded-full border border-primary-500/20 transition-colors"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <svg className="w-3 h-3 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                          </svg>
                          View Attachment
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Pagination */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 pt-8 border-t border-dark-border">
          <div className="flex items-center gap-2">
            <span className="text-[#71767b] text-sm">Rows per page:</span>
            <select
              value={limit}
              onChange={(e) => { setLimit(Number(e.target.value)); setPage(1); }}
              className="bg-[#16181c] border border-dark-border text-white text-sm rounded-lg p-2 focus:outline-none focus:border-primary-500"
            >
              <option value="10">10</option>
              <option value="20">20</option>
              <option value="50">50</option>
              <option value="100">100</option>
            </select>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-6 py-2 rounded-full border border-dark-border font-bold text-white hover:bg-[#202327] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                Previous
              </button>
              <span className="text-sm font-bold text-[#71767b]">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-6 py-2 rounded-full border border-dark-border font-bold text-white hover:bg-[#202327] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>

    </Layout >
  )
}
