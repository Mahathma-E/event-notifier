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
import { FiTrendingUp, FiCheckCircle, FiBookOpen, FiBell } from 'react-icons/fi'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'

// Custom Colors for Charts (Dark Mode Friendly)
const COLORS = ['#1d9bf0', '#f59e0b', '#00ba7c', '#f91880', '#8b5cf6', '#ec4899']

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

      // Mock data in case endpoint fails or returns empty for visual check
      // Ideally remove mock in production
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
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
        </div>
      </Layout>
    )
  }

  if (!analytics) {
    return (
      <Layout>
        <div className="text-center py-20 text-[#71767b]">
          <p className="text-lg">No analytics data available</p>
        </div>
      </Layout>
    )
  }

  const readPercentage =
    analytics.readStats.total_notifications > 0
      ? ((analytics.readStats.total_reads / analytics.readStats.total_notifications) * 100).toFixed(1)
      : '0'

  const acknowledgedPercentage =
    analytics.readStats.total_notifications > 0
      ? ((analytics.readStats.total_acknowledgments / analytics.readStats.total_notifications) * 100).toFixed(1)
      : '0'

  return (
    <Layout>
      <div className="max-w-[1200px] mx-auto p-4 sm:p-6 space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Analytics Dashboard</h1>
          <p className="text-[#71767b] mt-1">Overview of notification performance and engagement.</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-[#16181c] rounded-xl border border-dark-border p-5 relative overflow-hidden group hover:border-primary-500/50 transition-colors">
            <div className="flex justify-between items-start z-10 relative">
              <div>
                <p className="text-sm font-bold text-[#71767b] mb-1 uppercase tracking-wide">Total Notifications</p>
                <p className="text-3xl font-bold text-white group-hover:text-primary-500 transition-colors">{analytics.totalNotifications}</p>
              </div>
              <div className="w-10 h-10 bg-primary-500/10 rounded-full flex items-center justify-center text-primary-500 border border-primary-500/20">
                <FiBell className="w-5 h-5" />
              </div>
            </div>
            <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-primary-500/5 rounded-full blur-2xl group-hover:bg-primary-500/10 transition-colors"></div>
          </div>

          <div className="bg-[#16181c] rounded-xl border border-dark-border p-5 relative overflow-hidden group hover:border-[#00ba7c]/50 transition-colors">
            <div className="flex justify-between items-start z-10 relative">
              <div>
                <p className="text-sm font-bold text-[#71767b] mb-1 uppercase tracking-wide">Total Reads</p>
                <p className="text-3xl font-bold text-[#00ba7c]">{analytics.readStats.total_reads}</p>
                <p className="text-xs text-[#71767b] mt-1">Rate: {readPercentage}%</p>
              </div>
              <div className="w-10 h-10 bg-[#00ba7c]/10 rounded-full flex items-center justify-center text-[#00ba7c] border border-[#00ba7c]/20">
                <FiBookOpen className="w-5 h-5" />
              </div>
            </div>
            <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-[#00ba7c]/5 rounded-full blur-2xl group-hover:bg-[#00ba7c]/10 transition-colors"></div>
          </div>

          <div className="bg-[#16181c] rounded-xl border border-dark-border p-5 relative overflow-hidden group hover:border-[#f59e0b]/50 transition-colors">
            <div className="flex justify-between items-start z-10 relative">
              <div>
                <p className="text-sm font-bold text-[#71767b] mb-1 uppercase tracking-wide">Acknowledgments</p>
                <p className="text-3xl font-bold text-[#f59e0b]">{analytics.readStats.total_acknowledgments}</p>
                <p className="text-xs text-[#71767b] mt-1">Rate: {acknowledgedPercentage}%</p>
              </div>
              <div className="w-10 h-10 bg-[#f59e0b]/10 rounded-full flex items-center justify-center text-[#f59e0b] border border-[#f59e0b]/20">
                <FiCheckCircle className="w-5 h-5" />
              </div>
            </div>
            <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-[#f59e0b]/5 rounded-full blur-2xl group-hover:bg-[#f59e0b]/10 transition-colors"></div>
          </div>

          <div className="bg-[#16181c] rounded-xl border border-dark-border p-5 relative overflow-hidden group hover:border-[#f91880]/50 transition-colors">
            <div className="flex justify-between items-start z-10 relative">
              <div>
                <p className="text-sm font-bold text-[#71767b] mb-1 uppercase tracking-wide">Engagement Score</p>
                <p className="text-3xl font-bold text-[#f91880]">High</p>
                <p className="text-xs text-[#71767b] mt-1">Activity trend</p>
              </div>
              <div className="w-10 h-10 bg-[#f91880]/10 rounded-full flex items-center justify-center text-[#f91880] border border-[#f91880]/20">
                <FiTrendingUp className="w-5 h-5" />
              </div>
            </div>
            <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-[#f91880]/5 rounded-full blur-2xl group-hover:bg-[#f91880]/10 transition-colors"></div>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Notifications by Category */}
          <div className="bg-[#16181c] rounded-xl border border-dark-border p-6">
            <h2 className="text-lg font-bold text-white mb-6">By Category</h2>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={analytics.byCategory}
                    dataKey="count"
                    nameKey="category"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    innerRadius={60}
                    paddingAngle={5}
                    label={({ cx, cy, midAngle, innerRadius, outerRadius, value, index }) => {
                      const RADIAN = Math.PI / 180;
                      const radius = 25 + innerRadius + (outerRadius - innerRadius);
                      const x = cx + radius * Math.cos(-midAngle * RADIAN);
                      const y = cy + radius * Math.sin(-midAngle * RADIAN);
                      return (
                        <text x={x} y={y} fill="white" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" fontSize={12}>
                          {analytics.byCategory[index].category}
                        </text>
                      );
                    }}
                    stroke="none"
                  >
                    {analytics.byCategory.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#000', borderColor: '#2f3336', borderRadius: '8px', color: '#fff' }}
                    itemStyle={{ color: '#fff' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Notifications by Priority */}
          <div className="bg-[#16181c] rounded-xl border border-dark-border p-6">
            <h2 className="text-lg font-bold text-white mb-6">By Priority</h2>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics.byPriority}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2f3336" vertical={false} />
                  <XAxis dataKey="priority" stroke="#71767b" tick={{ fill: '#71767b' }} tickLine={false} axisLine={false} />
                  <YAxis stroke="#71767b" tick={{ fill: '#71767b' }} tickLine={false} axisLine={false} />
                  <Tooltip
                    cursor={{ fill: '#2f3336', opacity: 0.2 }}
                    contentStyle={{ backgroundColor: '#000', borderColor: '#2f3336', borderRadius: '8px', color: '#fff' }}
                  />
                  <Bar dataKey="count" fill="#1d9bf0" radius={[4, 4, 0, 0]} barSize={50} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Daily Trend */}
          <div className="bg-[#16181c] rounded-xl border border-dark-border p-6 lg:col-span-2">
            <h2 className="text-lg font-bold text-white mb-6">Daily Trend (Last 30 Days)</h2>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={analytics.dailyTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2f3336" vertical={false} />
                  <XAxis dataKey="date" stroke="#71767b" tick={{ fill: '#71767b' }} tickLine={false} axisLine={false} />
                  <YAxis stroke="#71767b" tick={{ fill: '#71767b' }} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#000', borderColor: '#2f3336', borderRadius: '8px', color: '#fff' }}
                  />
                  <Line type="monotone" dataKey="count" stroke="#1d9bf0" strokeWidth={3} dot={{ r: 4, fill: '#1d9bf0', strokeWidth: 0 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>


          {/* Department Reach */}
          <div className="bg-[#16181c] rounded-xl border border-dark-border p-6 lg:col-span-2">
            <h2 className="text-lg font-bold text-white mb-6">Department-wise Reach</h2>
            <div className="h-[400px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={analytics.departmentReach.map((item: any) => ({
                    ...item,
                    short_name: (() => {
                      const name = item.department_name || '';
                      if (name.includes('Information Technology')) return 'IT';
                      if (name.includes('Computer Science')) return 'CSE';
                      if (name.includes('Electronics')) return 'ECE';
                      if (name.includes('Electrical')) return 'EEE';
                      if (name.includes('Mechanical')) return 'MECH';
                      if (name.includes('Civil')) return 'CIVIL';
                      return name;
                    })()
                  }))}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#2f3336" vertical={false} />
                  <XAxis dataKey="short_name" stroke="#71767b" tick={{ fill: '#71767b', fontSize: 12 }} tickLine={false} axisLine={false} />
                  <YAxis stroke="#71767b" tick={{ fill: '#71767b' }} tickLine={false} axisLine={false} />
                  <Tooltip
                    cursor={{ fill: '#2f3336', opacity: 0.2 }}
                    contentStyle={{ backgroundColor: '#000', borderColor: '#2f3336', borderRadius: '8px', color: '#fff' }}
                  />
                  <Legend wrapperStyle={{ paddingTop: '20px' }} />
                  <Bar dataKey="notification_count" fill="#1d9bf0" name="Notifications" stackId="a" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="read_count" fill="#00ba7c" name="Reads" stackId="b" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="acknowledged_count" fill="#f59e0b" name="Acknowledged" stackId="c" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Recent Notifications */}
        <div className="bg-[#16181c] rounded-xl border border-dark-border overflow-hidden">
          <div className="p-6 border-b border-dark-border bg-[#1d1f23]">
            <h2 className="text-lg font-bold text-white">Recent Notifications</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[#202327]/50 border-b border-dark-border">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-[#71767b] uppercase tracking-wider">
                    Title
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-[#71767b] uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-[#71767b] uppercase tracking-wider">
                    Priority
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-[#71767b] uppercase tracking-wider">
                    Reads
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-[#71767b] uppercase tracking-wider">
                    Acknowledged
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-border">
                {analytics.recentNotifications.map((notification: any) => (
                  <tr key={notification.id} className="hover:bg-[#202327] transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-white">
                      {notification.title}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-[#71767b]">
                      {notification.category}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2.5 py-1 text-xs font-bold rounded uppercase tracking-wide border ${notification.priority === 'Emergency'
                          ? 'bg-red-500/10 text-red-500 border-red-500/20'
                          : notification.priority === 'High'
                            ? 'bg-orange-500/10 text-orange-500 border-orange-500/20'
                            : 'bg-blue-500/10 text-blue-500 border-blue-500/20'
                          }`}
                      >
                        {notification.priority}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-white font-medium">
                      {notification.read_count}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-white font-medium">
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
