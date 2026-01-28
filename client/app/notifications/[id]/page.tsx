'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter, useParams } from 'next/navigation'
import Layout from '@/components/Layout'
import axios from 'axios'
import Cookies from 'js-cookie'
import { format } from 'date-fns'
import { FiCheckCircle, FiEdit, FiTrash2, FiArrowLeft } from 'react-icons/fi'

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
  section?: string
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

  if (authLoading || loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
        </div>
      </Layout>
    )
  }

  if (!notification) {
    return (
      <Layout>
        <div className="text-center py-12">
          <p className="text-gray-500">Notification not found</p>
        </div>
      </Layout>
    )
  }

  const canEdit = user?.role === 'admin' || (user?.role === 'faculty' && notification.created_by_name === user?.name)

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Back Button */}
        <button
          onClick={() => router.back()}
          className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
        >
          <FiArrowLeft />
          <span>Back</span>
        </button>

        {/* Notification Card */}
        <div className="bg-white rounded-lg shadow-lg">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-3">
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
                <h1 className="text-3xl font-bold text-gray-900 mb-2">{notification.title}</h1>
                <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                  <span>By {notification.created_by_name}</span>
                  {notification.department_name && (
                    <span>• {notification.department_name}</span>
                  )}
                  {notification.year && <span>• Year {notification.year}</span>}
                  {notification.section && <span>• Section {notification.section}</span>}
                  <span>• {format(new Date(notification.created_at), 'MMM d, yyyy h:mm a')}</span>
                </div>
              </div>
              {canEdit && (
                <div className="flex items-center space-x-2 ml-4">
                  <button
                    onClick={() => router.push(`/notifications/${params.id}/edit`)}
                    className="p-2 text-gray-600 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                  >
                    <FiEdit className="w-5 h-5" />
                  </button>
                  <button
                    onClick={handleDelete}
                    className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <FiTrash2 className="w-5 h-5" />
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="p-6">
            <div className="prose max-w-none">
              <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                {notification.content}
              </p>
            </div>
          </div>

          <div className="p-6 border-t border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-6 text-sm text-gray-600">
                <span>{notification.read_count} read</span>
                <span>{notification.acknowledged_count} acknowledged</span>
              </div>
              {user?.role === 'student' && (
                <button
                  onClick={handleAcknowledge}
                  disabled={acknowledging || notification.user_status === 'acknowledged'}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                    notification.user_status === 'acknowledged'
                      ? 'bg-green-100 text-green-700 cursor-not-allowed'
                      : 'bg-primary-600 text-white hover:bg-primary-700'
                  } disabled:opacity-50`}
                >
                  <FiCheckCircle />
                  <span>
                    {notification.user_status === 'acknowledged'
                      ? 'Acknowledged'
                      : 'Acknowledge'}
                  </span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}
