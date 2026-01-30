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
  FiArrowRight,
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
  attachment_url?: string
  attachment_type?: string
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
        return 'bg-red-500/20 text-red-400 border-red-500/50'
      case 'High':
        return 'bg-orange-500/20 text-orange-400 border-orange-500/50'
      case 'Normal':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/50'
      case 'Info':
        return 'bg-gray-500/20 text-gray-400 border-gray-500/50'
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/50'
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
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
        </div>
      </Layout>
    )
  }

  if (!user) {
    return null
  }

  return (
    <Layout>
      <div className="space-y-8 max-w-[1000px] mx-auto p-4 sm:p-6">
        {/* Welcome Section */}
        <div>
          <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">
            Dashboard
          </h1>
          <p className="text-[#71767b] text-lg">
            Good afternoon, {user?.name}. Here's what's happening.
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-[#16181c] rounded-xl border border-dark-border p-5 hover:bg-[#202327] transition-colors group">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-bold text-[#71767b] mb-1 uppercase tracking-wide">Total Notifications</p>
                <p className="text-3xl font-bold text-white group-hover:text-primary-500 transition-colors">{stats.total}</p>
              </div>
              <div className="w-10 h-10 bg-primary-500/10 rounded-full flex items-center justify-center border border-primary-500/20 group-hover:scale-110 transition-transform">
                <FiBell className="w-5 h-5 text-primary-500" />
              </div>
            </div>
          </div>

          <div className="bg-[#16181c] rounded-xl border border-dark-border p-5 hover:bg-[#202327] transition-colors group">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-bold text-[#71767b] mb-1 uppercase tracking-wide">Unread</p>
                <p className="text-3xl font-bold text-orange-500">{stats.unread}</p>
              </div>
              <div className="w-10 h-10 bg-orange-500/10 rounded-full flex items-center justify-center border border-orange-500/20 group-hover:scale-110 transition-transform">
                <FiAlertCircle className="w-5 h-5 text-orange-500" />
              </div>
            </div>
          </div>

          <div className="bg-[#16181c] rounded-xl border border-dark-border p-5 hover:bg-[#202327] transition-colors group">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-bold text-[#71767b] mb-1 uppercase tracking-wide">Acknowledged</p>
                <p className="text-3xl font-bold text-green-500">{stats.acknowledged}</p>
              </div>
              <div className="w-10 h-10 bg-green-500/10 rounded-full flex items-center justify-center border border-green-500/20 group-hover:scale-110 transition-transform">
                <FiCheckCircle className="w-5 h-5 text-green-500" />
              </div>
            </div>
          </div>

          <div className="bg-[#16181c] rounded-xl border border-dark-border p-5 hover:bg-[#202327] transition-colors group">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-bold text-[#71767b] mb-1 uppercase tracking-wide">Urgent</p>
                <p className="text-3xl font-bold text-red-500">{stats.urgent}</p>
              </div>
              <div className="w-10 h-10 bg-red-500/10 rounded-full flex items-center justify-center border border-red-500/20 group-hover:scale-110 transition-transform">
                <FiTrendingUp className="w-5 h-5 text-red-500" />
              </div>
            </div>
          </div>
        </div>

        {/* Recent Notifications */}
        <div className="bg-[#16181c] rounded-xl border border-dark-border overflow-hidden">
          <div className="p-4 border-b border-dark-border bg-[#1d1f23] flex justify-between items-center">
            <h2 className="text-lg font-bold text-white">Recent Notifications</h2>
            <button
              onClick={() => router.push('/notifications')}
              className="text-primary-500 text-sm font-bold hover:underline flex items-center gap-1"
            >
              View All <FiArrowRight />
            </button>
          </div>
          <div className="divide-y divide-dark-border">
            {notifications.length === 0 ? (
              <div className="p-12 text-center text-[#71767b]">
                <FiBell className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p className="font-medium">No notifications yet</p>
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-5 hover:bg-[#202327] transition-colors cursor-pointer group ${!notification.is_read ? 'bg-[#1a1d21]' : 'bg-transparent'}`}
                  onClick={() => router.push(`/notifications/${notification.id}`)}
                >
                  <div className="flex items-start gap-4">
                    {/* Icon/Avatar Placeholder */}
                    <div className="w-10 h-10 rounded-full bg-[#2f3336] flex items-center justify-center flex-shrink-0">
                      {getCategoryIcon(notification.category)}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center space-x-2">
                          {notification.is_pinned && (
                            <span className="text-[10px] font-bold text-yellow-500 bg-yellow-500/10 px-1.5 py-0.5 rounded uppercase tracking-wide border border-yellow-500/20">
                              PINNED
                            </span>
                          )}
                          <span className="text-sm font-bold text-white truncate group-hover:underline">
                            {notification.title}
                          </span>
                        </div>
                        <span className="text-xs text-[#71767b] whitespace-nowrap">
                          {new Date(notification.created_at).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                          })}
                        </span>
                      </div>

                      <p className="text-[#71767b] text-sm line-clamp-2 mb-2 leading-relaxed">
                        {notification.content}
                      </p>

                      <div className="flex items-center gap-3">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded border ${getPriorityColor(
                            notification.priority
                          )}`}
                        >
                          {notification.priority.toUpperCase()}
                        </span>
                        <span className="text-xs text-[#71767b] bg-[#2f3336] px-2 py-0.5 rounded-full font-medium">
                          {notification.category}
                        </span>
                        {notification.read_count > 0 && (
                          <span className="text-xs text-[#71767b]">{notification.read_count} read</span>
                        )}
                      </div>

                      {notification.attachment_url && (
                        <div className="mt-3">
                          <a
                            href={`${API_URL.replace('/api', '')}${notification.attachment_url}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center text-xs text-primary-500 hover:text-primary-400 font-bold bg-primary-500/10 px-3 py-1.5 rounded-full border border-primary-500/20 max-w-fit"
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

                    {!notification.is_read && (
                      <div className="flex-shrink-0 self-center">
                        <div className="w-2.5 h-2.5 bg-primary-500 rounded-full shadow-[0_0_8px_rgba(29,155,240,0.5)]"></div>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </Layout>
  )
}
