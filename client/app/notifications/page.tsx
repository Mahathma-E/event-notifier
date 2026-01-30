'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import Layout from '@/components/Layout'
import axios from 'axios'
import Cookies from 'js-cookie'
import { FiSearch, FiFilter, FiX } from 'react-icons/fi'
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

interface ChannelPost {
  id: number
  title: string
  content: string
  author_name: string
  created_at: string
  channel_name: string
  channel_id: number
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
  const [totalPages, setTotalPages] = useState(1)

  // Channel Notifications
  const [activeTab, setActiveTab] = useState<'global' | 'channels'>('global')
  const [channelUpdates, setChannelUpdates] = useState<ChannelPost[]>([])

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
    }
  }, [user, authLoading, router])

  useEffect(() => {
    if (user) {
      if (activeTab === 'global') {
        fetchNotifications()
      } else {
        fetchChannelUpdates()
      }
    }
  }, [user, page, search, filters, activeTab])

  const fetchNotifications = async () => {
    try {
      setLoading(true)
      const token = Cookies.get('token')
      if (token) {
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
      }

      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
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

  const fetchChannelUpdates = async () => {
    try {
      setLoading(true)
      const token = Cookies.get('token')
      if (token) axios.defaults.headers.common['Authorization'] = `Bearer ${token}`

      // We need an endpoint for "My Channel Feed". 
      // For now, let's fetch my channels, then fetch posts for each.
      // This is inefficient but works for MVP without new backend endpoint.
      // Better: Add GET /api/users/channel-feed.
      // Let's implement the inefficient client-side aggregation for now to save backend turn.
      // Actually, I can use the existing /channels endpoint to get my channels?

      // 1. Get my channels (or all and filter)
      const channelsRes = await axios.get(`${API_URL}/channels`)
      // We need to know which ones I am a member of.
      // The backend list doesn't explicitly return "is_member".
      // I will loop through channels and check membership? Too many requests.
      // Optimization: Assume I can see all public channels? No, "Only joined members".
      // The backend `GET /channels` filters visibility but not "membership".
      // I'll add a new endpoint or just use what I have.

      // Let's try to hit a new endpoint I'll assume I can create or use logic.
      // Actually, I'll create a quick helper in backend? No, stick to frontend for this step.
      // Let's filter channels I've joined.

      // Wait, I can't easily know which ones I joined without querying each.
      // STARTUPS HACK: Just fetch posts from ALL visible channels and filter by "is member" if possible?
      // No. 

      // I will assume I need to ADD a backend endpoint for this to be usable.
      // But I am in frontend file edit.
      // I'll skip fetching for a second and assume I'll add the endpoint next step.
      // Let's just mock it or assume `GET /api/channels/feed` exists.
      // I will add `GET /api/user/feed` to users.js or channels.js next.

      const feedRes = await axios.get(`${API_URL}/users/channel-feed`)
      setChannelUpdates(feedRes.data)

    } catch (error) {
      console.error('Failed to fetch channel updates', error)
      // Fallback or empty
      setChannelUpdates([])
    } finally {
      setLoading(false)
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Emergency':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'High':
        return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'Normal':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'Info':
        return 'bg-gray-100 text-gray-800 border-gray-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const clearFilters = () => {
    setFilters({ category: '', priority: '' })
    setSearch('')
  }

  if (authLoading || (loading && notifications.length === 0)) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[40vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-3xl font-bold text-gray-900 mb-4 sm:mb-0">Notifications</h1>
          {(user?.role === 'admin' || user?.role === 'faculty') && (
            <button
              onClick={() => router.push('/notifications/create')}
              className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors"
            >
              Create Notification
            </button>
          )}
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-gray-200">
          <button
            className={`py-2 px-4 font-medium text-sm focus:outline-none ${activeTab === 'global' ? 'border-b-2 border-primary-600 text-primary-600' : 'text-gray-500 hover:text-gray-700'}`}
            onClick={() => setActiveTab('global')}
          >
            Campus Updates
          </button>
          <button
            className={`py-2 px-4 font-medium text-sm focus:outline-none ${activeTab === 'channels' ? 'border-b-2 border-primary-600 text-primary-600' : 'text-gray-500 hover:text-gray-700'}`}
            onClick={() => setActiveTab('channels')}
          >
            Channel Activity
          </button>
        </div>

        {/* Search and Filters (Only for Global) */}
        {activeTab === 'global' && (
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search notifications..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                <FiFilter />
                <span>Filters</span>
              </button>
            </div>

            {showFilters && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Category
                    </label>
                    <select
                      value={filters.category}
                      onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
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
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Priority
                    </label>
                    <select
                      value={filters.priority}
                      onChange={(e) => setFilters({ ...filters, priority: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
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
                  <button
                    onClick={clearFilters}
                    className="mt-4 flex items-center space-x-2 text-sm text-gray-600 hover:text-gray-900"
                  >
                    <FiX />
                    <span>Clear filters</span>
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* Notifications List */}
        {activeTab === 'global' ? (
          <div className="space-y-4">
            {notifications.length === 0 ? (
              <div className="bg-white rounded-lg shadow p-12 text-center">
                <p className="text-gray-500">No notifications found</p>
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow cursor-pointer ${notification.is_pinned ? 'border-l-4 border-yellow-400 bg-yellow-50' : ''
                    } ${!notification.is_read ? 'border-l-4 border-blue-500' : ''}`}
                  onClick={() => router.push(`/notifications/${notification.id}`)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        {notification.is_pinned && (
                          <span className="text-xs font-semibold text-yellow-600 bg-yellow-100 px-2 py-1 rounded">
                            PINNED
                          </span>
                        )}
                        <span
                          className={`text-xs font-semibold px-2 py-1 rounded border ${getPriorityColor(
                            notification.priority
                          )}`}
                        >
                          {notification.priority}
                        </span>
                        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                          {notification.category}
                        </span>
                      </div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">
                        {notification.title}
                      </h3>
                      <p className="text-gray-600 mb-4 line-clamp-3">{notification.content}</p>
                      <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                        <span>By {notification.created_by_name}</span>
                        {notification.department_name && (
                          <span>• {notification.department_name}</span>
                        )}
                        <span>• {format(new Date(notification.created_at), 'MMM d, yyyy h:mm a')}</span>
                        {notification.read_count > 0 && (
                          <span>• {notification.read_count} read</span>
                        )}
                        {notification.acknowledged_count > 0 && (
                          <span>• {notification.acknowledged_count} acknowledged</span>
                        )}
                      </div>
                      {notification.attachment_url && (
                        <a
                          href={`${API_URL.replace('/api', '')}${notification.attachment_url}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-3 inline-flex items-center text-sm text-primary-600 hover:text-primary-700 font-medium"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                          </svg>
                          View Attachment
                        </a>
                      )}
                    </div>
                    {!notification.is_read && (
                      <div className="ml-4">
                        <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center space-x-2 pt-4 border-t border-gray-100">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Previous
                </button>
                <span className="px-4 py-2 text-sm text-gray-600">
                  Page {page} of {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        ) : (
          channelUpdates.map(post => (
            <div
              key={post.id}
              className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow cursor-pointer border-l-4 border-indigo-500"
              onClick={() => router.push(`/channels/${post.channel_id}`)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="text-xs font-semibold px-2 py-1 rounded bg-indigo-100 text-indigo-800">
                      #{post.channel_name}
                    </span>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {post.title}
                  </h3>
                  <p className="text-gray-600 mb-4 line-clamp-3">{post.content}</p>
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span>By {post.author_name}</span>
                    <span>• {format(new Date(post.created_at), 'MMM d, yyyy h:mm a')}</span>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

    </Layout >
  )
}
