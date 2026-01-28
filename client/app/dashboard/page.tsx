'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import Layout from '@/components/Layout'
import axios from 'axios'
import Cookies from 'js-cookie'
import { useSocket } from '@/hooks/useSocket'
import {
  FiBell,
  FiCheckCircle,
  FiAlertCircle,
  FiInfo,
  FiTrendingUp,
} from 'react-icons/fi'

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
}

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [stats, setStats] = useState({
    total: 0,
    unread: 0,
    acknowledged: 0,
    urgent: 0,
  })
  const [loading, setLoading] = useState(true)
  const socket = useSocket()

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
    }
  }, [user, authLoading, router])

  useEffect(() => {
    if (user) {
      fetchNotifications()
    }
  }, [user])

  useEffect(() => {
    if (socket) {
      socket.on('new-notification', (notification: Notification) => {
        setNotifications((prev) => [notification, ...prev])
        setStats((prev) => ({
          ...prev,
          total: prev.total + 1,
          unread: prev.unread + 1,
          urgent: prev.urgent + (notification.priority === 'Emergency' || notification.priority === 'High' ? 1 : 0),
        }))
      })

      return () => {
        socket.off('new-notification')
      }
    }
  }, [socket])

  const fetchNotifications = async () => {
    try {
      const token = Cookies.get('token')
      if (token) {
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
      }

      const response = await axios.get(`${API_URL}/notifications?limit=10`)
      const data = response.data.notifications

      setNotifications(data)
      setStats({
        total: response.data.pagination.total,
        unread: data.filter((n: Notification) => !n.is_read).length,
        acknowledged: data.filter((n: Notification) => n.acknowledged_count > 0).length,
        urgent: data.filter((n: Notification) => n.priority === 'Emergency' || n.priority === 'High').length,
      })
    } catch (error) {
      console.error('Failed to fetch notifications:', error)
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

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Emergency':
        return <FiAlertCircle className="w-5 h-5" />
      case 'Exam':
        return <FiCheckCircle className="w-5 h-5" />
      default:
        return <FiInfo className="w-5 h-5" />
    }
  }


  if ((authLoading || loading)) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[40vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
        </div>
      </Layout>
    )
  }

  if (!user) {
    return null
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Welcome Section */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome back, {user?.name}!
          </h1>
          <p className="text-gray-600">
            Here's what's happening with your notifications
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Notifications</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
                <FiBell className="w-6 h-6 text-primary-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Unread</p>
                <p className="text-2xl font-bold text-orange-600">{stats.unread}</p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                <FiAlertCircle className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Acknowledged</p>
                <p className="text-2xl font-bold text-green-600">{stats.acknowledged}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <FiCheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Urgent</p>
                <p className="text-2xl font-bold text-red-600">{stats.urgent}</p>
              </div>
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <FiTrendingUp className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Recent Notifications */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Recent Notifications</h2>
          </div>
          <div className="divide-y divide-gray-200">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <FiBell className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <p>No notifications yet</p>
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-6 hover:bg-gray-50 transition-colors cursor-pointer ${notification.is_pinned ? 'bg-yellow-50 border-l-4 border-yellow-400' : ''
                    } ${!notification.is_read ? 'bg-blue-50' : ''}`}
                  onClick={() => router.push(`/notifications/${notification.id}`)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
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
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">
                        {notification.title}
                      </h3>
                      <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                        {notification.content}
                      </p>
                      <div className="flex items-center space-x-4 text-xs text-gray-500">
                        <span>
                          {new Date(notification.created_at).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                        {notification.read_count > 0 && (
                          <span>{notification.read_count} read</span>
                        )}
                        {notification.acknowledged_count > 0 && (
                          <span>{notification.acknowledged_count} acknowledged</span>
                        )}
                      </div>
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
          </div>
          {notifications.length > 0 && (
            <div className="p-4 border-t border-gray-200 text-center">
              <button
                onClick={() => router.push('/notifications')}
                className="text-primary-600 hover:text-primary-700 font-medium"
              >
                View All Notifications →
              </button>
            </div>
          )}
        </div>
      </div>
    </Layout>
  )
}
