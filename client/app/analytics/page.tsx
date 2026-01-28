'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import Layout from '@/components/Layout'
import axios from 'axios'
import Cookies from 'js-cookie'
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'

const COLORS = ['#0ea5e9', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6', '#ec4899']

export default function AnalyticsPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [analytics, setAnalytics] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!authLoading && (!user || (user.role !== 'admin' && user.role !== 'faculty'))) {
      router.push('/dashboard')
    }
  }, [user, authLoading, router])

  useEffect(() => {
    if (user) {
      fetchAnalytics()
    }
  }, [user])

  const fetchAnalytics = async () => {
    try {
      setLoading(true)
      const token = Cookies.get('token')
      if (token) {
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
      }

      const response = await axios.get(`${API_URL}/analytics/dashboard`)
      setAnalytics(response.data)
    } catch (error) {
      console.error('Failed to fetch analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  if (authLoading || loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[40vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
        </div>
      </Layout>
    )
  }

  if (!analytics) {
    return (
      <Layout>
        <div className="text-center py-12">
          <p className="text-gray-500">No analytics data available</p>
        </div>
      </Layout>
    )
  }

  const readPercentage =
    analytics.readStats.total_notifications > 0
      ? ((analytics.readStats.total_reads / analytics.readStats.total_notifications) * 100).toFixed(1)
      : 0

  const acknowledgedPercentage =
    analytics.readStats.total_notifications > 0
      ? ((analytics.readStats.total_acknowledgments / analytics.readStats.total_notifications) * 100).toFixed(1)
      : 0

  return (
    <Layout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm text-gray-600 mb-1">Total Notifications</p>
            <p className="text-3xl font-bold text-gray-900">{analytics.totalNotifications}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm text-gray-600 mb-1">Total Reads</p>
            <p className="text-3xl font-bold text-blue-600">{analytics.readStats.total_reads}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm text-gray-600 mb-1">Total Acknowledgments</p>
            <p className="text-3xl font-bold text-green-600">
              {analytics.readStats.total_acknowledgments}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm text-gray-600 mb-1">Read Rate</p>
            <p className="text-3xl font-bold text-primary-600">{readPercentage}%</p>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Notifications by Category */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">By Category</h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={analytics.byCategory}
                  dataKey="count"
                  nameKey="category"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label
                >
                  {analytics.byCategory.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Notifications by Priority */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">By Priority</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analytics.byPriority}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="priority" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="count" fill="#0ea5e9" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Daily Trend */}
          <div className="bg-white rounded-lg shadow p-6 lg:col-span-2">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Daily Trend (Last 30 Days)</h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={analytics.dailyTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="count" stroke="#0ea5e9" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Department Reach */}
          <div className="bg-white rounded-lg shadow p-6 lg:col-span-2">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Department-wise Reach</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analytics.departmentReach}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="department_name" angle={-45} textAnchor="end" height={100} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="notification_count" fill="#0ea5e9" name="Notifications" />
                <Bar dataKey="read_count" fill="#10b981" name="Reads" />
                <Bar dataKey="acknowledged_count" fill="#f59e0b" name="Acknowledged" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Notifications */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Recent Notifications</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Title
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Priority
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Reads
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acknowledged
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {analytics.recentNotifications.map((notification: any) => (
                  <tr key={notification.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {notification.title}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {notification.category}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 text-xs font-semibold rounded ${notification.priority === 'Emergency'
                            ? 'bg-red-100 text-red-800'
                            : notification.priority === 'High'
                              ? 'bg-orange-100 text-orange-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}
                      >
                        {notification.priority}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {notification.read_count}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {notification.acknowledged_count}
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
