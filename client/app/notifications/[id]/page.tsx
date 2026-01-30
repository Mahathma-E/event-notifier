'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter, useParams } from 'next/navigation'
import Layout from '@/components/Layout'
import axios from 'axios'
import Cookies from 'js-cookie'
import { format } from 'date-fns'
import { FiCheckCircle, FiEdit, FiTrash2, FiArrowLeft, FiDownload } from 'react-icons/fi'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'

interface Notification {
  id: number
  title: string
  content: string
  category: string
  priority: string
  created_at: string
  updated_at: string
  is_pinned: boolean
  is_read: boolean
  user_status: string
  read_count: number
  acknowledged_count: number
  created_by_name: string
  department_name?: string
  department_id?: number
  year?: number
  attachment_url?: string
  attachment_type?: string
}

export default function NotificationDetailPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const params = useParams()
  const [notification, setNotification] = useState<Notification | null>(null)
  const [loading, setLoading] = useState(true)
  const [acknowledging, setAcknowledging] = useState(false)

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
    }
  }, [user, authLoading, router])

  useEffect(() => {
    if (user && params.id) {
      fetchNotification()
    }
  }, [user, params.id])

  const fetchNotification = async () => {
    try {
      setLoading(true)
      const token = Cookies.get('token')
      if (token) {
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
      }

      const response = await axios.get(`${API_URL}/notifications/${params.id}`)
      setNotification(response.data.notification)

      // Mark as read if not already read
      if (!response.data.notification.is_read) {
        await axios.post(`${API_URL}/notifications/${params.id}/acknowledge`, {
          status: 'read',
        })
      }
    } catch (error) {
      console.error('Failed to fetch notification:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAcknowledge = async () => {
    try {
      setAcknowledging(true)
      const token = Cookies.get('token')
      if (token) {
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
      }

      await axios.post(`${API_URL}/notifications/${params.id}/acknowledge`, {
        status: 'acknowledged',
      })

      if (notification) {
        setNotification({
          ...notification,
          user_status: 'acknowledged',
          acknowledged_count: notification.acknowledged_count + 1,
        })
      }
    } catch (error) {
      console.error('Failed to acknowledge notification:', error)
    } finally {
      setAcknowledging(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this notification?')) {
      return
    }

    try {
      const token = Cookies.get('token')
      if (token) {
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
      }

      await axios.delete(`${API_URL}/notifications/${params.id}`)
      router.push('/notifications')
    } catch (error) {
      console.error('Failed to delete notification:', error)
      alert('Failed to delete notification')
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

  if (authLoading || loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
        </div>
      </Layout>
    )
  }

  if (!notification) {
    return (
      <Layout>
        <div className="text-center py-20 text-[#71767b]">
          <p className="text-lg">Notification not found</p>
        </div>
      </Layout>
    )
  }

  const canEdit = user?.role === 'admin' || (user?.role === 'faculty' && notification.created_by_name === user?.name)

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-6 p-4 sm:p-6">
        {/* Back Button */}
        <button
          onClick={() => router.back()}
          className="flex items-center space-x-2 text-[#71767b] hover:text-white transition-colors group"
        >
          <FiArrowLeft className="group-hover:-translate-x-1 transition-transform" />
          <span>Back</span>
        </button>

        {/* Notification Card */}
        <div className="bg-[#16181c] rounded-xl border border-dark-border overflow-hidden">
          <div className="p-6 sm:p-8 border-b border-dark-border">
            <div className="flex items-start justify-between mb-6">
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-4">
                  {notification.is_pinned && (
                    <span className="text-xs font-bold text-[#f59e0b] bg-[#f59e0b]/10 border border-[#f59e0b]/20 px-2 py-1 rounded uppercase tracking-wide">
                      PINNED
                    </span>
                  )}
                  <span
                    className={`text-xs font-bold px-2 py-1 rounded border uppercase tracking-wide ${getPriorityColor(
                      notification.priority
                    )}`}
                  >
                    {notification.priority}
                  </span>
                  <span className="text-xs font-bold text-[#71767b] bg-[#202327] border border-dark-border px-2 py-1 rounded uppercase tracking-wide">
                    {notification.category}
                  </span>
                </div>

                <h1 className="text-2xl sm:text-3xl font-bold text-white mb-3 break-words">{notification.title}</h1>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-[#71767b]">
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center text-white text-xs font-bold">
                      {notification.created_by_name.charAt(0).toUpperCase()}
                    </div>
                    <span>{notification.created_by_name}</span>
                  </div>
                  {notification.department_name && (
                    <span>• {notification.department_name}</span>
                  )}
                  {notification.year && <span>• Year {notification.year}</span>}
                  <span>• {format(new Date(notification.created_at), 'MMM d, yyyy • h:mm a')}</span>
                </div>
              </div>

              {canEdit && (
                <div className="flex items-center space-x-2 ml-4">
                  <button
                    onClick={() => router.push(`/notifications/${params.id}/edit`)}
                    className="p-2 text-[#71767b] hover:text-primary-500 hover:bg-primary-500/10 rounded-full transition-colors"
                    title="Edit"
                  >
                    <FiEdit className="w-5 h-5" />
                  </button>
                  <button
                    onClick={handleDelete}
                    className="p-2 text-[#71767b] hover:text-red-500 hover:bg-red-500/10 rounded-full transition-colors"
                    title="Delete"
                  >
                    <FiTrash2 className="w-5 h-5" />
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="p-6 sm:p-8">
            <div className="prose prose-invert max-w-none">
              <p className="text-[#dbebec] whitespace-pre-wrap leading-relaxed text-lg font-light">
                {notification.content}
              </p>
            </div>
          </div>

          {notification.attachment_url && (
            <div className="px-6 sm:px-8 pb-8 mt-0">
              <h3 className="text-sm font-bold text-[#71767b] mb-3 uppercase tracking-wide">Attachment</h3>
              <a
                href={`${API_URL.replace('/api', '')}${notification.attachment_url}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center space-x-4 p-4 border border-dark-border rounded-xl bg-[#202327]/50 hover:bg-[#202327] hover:border-primary-500/50 transition-all group w-full sm:w-auto"
              >
                <div className="p-3 bg-primary-500/10 rounded-lg group-hover:bg-primary-500/20 transition-colors text-primary-500 border border-primary-500/20">
                  <FiDownload className="w-6 h-6" />
                </div>
                <div className="text-left">
                  <p className="text-base font-bold text-white group-hover:text-primary-500 transition-colors">Download Attachment</p>
                  <p className="text-xs text-[#71767b]">Click to view or download file</p>
                </div>
              </a>
            </div>
          )}

          <div className="p-6 sm:p-8 border-t border-dark-border bg-[#1d1f23]/50">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center space-x-6 text-sm text-[#71767b] font-medium">
                <span className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#00ba7c]"></span>
                  {notification.read_count} read
                </span>
                <span className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#f59e0b]"></span>
                  {notification.acknowledged_count} acknowledged
                </span>
              </div>

              {user?.role === 'student' && (
                <button
                  onClick={handleAcknowledge}
                  disabled={acknowledging || notification.user_status === 'acknowledged'}
                  className={`flex items-center space-x-2 px-6 py-2.5 rounded-full font-bold transition-all w-full sm:w-auto justify-center ${notification.user_status === 'acknowledged'
                      ? 'bg-[#00ba7c]/10 text-[#00ba7c] cursor-not-allowed border border-[#00ba7c]/20'
                      : 'bg-primary-500 text-white hover:bg-primary-600 shadow-lg shadow-primary-500/20'
                    } disabled:opacity-50`}
                >
                  <FiCheckCircle className={notification.user_status === 'acknowledged' ? 'fill-current' : ''} />
                  <span>
                    {notification.user_status === 'acknowledged'
                      ? 'Acknowledged'
                      : 'Acknowledge Receipt'}
                  </span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout >
  )
}
