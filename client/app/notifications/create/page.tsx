'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import Layout from '@/components/Layout'
import axios from 'axios'
import Cookies from 'js-cookie'
import { FiArrowLeft } from 'react-icons/fi'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'

export default function CreateNotificationPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [departments, setDepartments] = useState<any[]>([])
  const [roles, setRoles] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category: 'Academic',
    priority: 'Normal',
    department_id: '',
    year: '',
    scheduled_at: '',
    is_pinned: false,
    attachment: null as File | null,
    roles: [] as number[],
  })

  useEffect(() => {
    if (!authLoading && (!user || (user.role !== 'admin' && user.role !== 'faculty'))) {
      router.push('/dashboard')
    }
  }, [user, authLoading, router])

  useEffect(() => {
    if (user) {
      fetchDepartments()
      fetchRoles()
      // Set default department for faculty
      if (user.role === 'faculty' && user.department_id) {
        setFormData((prev) => ({ ...prev, department_id: user.department_id?.toString() || '' }))
      }
    }
  }, [user])

  const fetchDepartments = async () => {
    try {
      const token = Cookies.get('token')
      if (token) {
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
      }
      const response = await axios.get(`${API_URL}/departments`)
      setDepartments(response.data.departments)
    } catch (error) {
      console.error('Failed to fetch departments')
    }
  }

  const fetchRoles = async () => {
    try {
      const response = await axios.get(`${API_URL}/roles`)
      setRoles(response.data)
    } catch (error) {
      console.error('Failed to fetch roles')
    }
  }

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target
    if (type === 'file') {
      const file = (e.target as HTMLInputElement).files?.[0] || null
      setFormData({ ...formData, attachment: file })
    } else {
      setFormData({
        ...formData,
        [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
      })
    }
  }

  const toggleRole = (roleId: number) => {
    setFormData(prev => {
      if (prev.roles.includes(roleId)) {
        return { ...prev, roles: prev.roles.filter(id => id !== roleId) }
      } else {
        return { ...prev, roles: [...prev.roles, roleId] }
      }
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const token = Cookies.get('token')
      if (token) {
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
      }

      const payload = new FormData()
      payload.append('title', formData.title)
      payload.append('content', formData.content)
      payload.append('category', formData.category)
      payload.append('priority', formData.priority)
      if (formData.department_id) payload.append('department_id', formData.department_id)
      if (formData.year) payload.append('year', formData.year)
      if (formData.scheduled_at) payload.append('scheduled_at', formData.scheduled_at)
      payload.append('is_pinned', String(formData.is_pinned))
      if (formData.attachment) {
        payload.append('attachment', formData.attachment)
      }
      if (formData.roles.length > 0) {
        payload.append('roles', JSON.stringify(formData.roles))
      }

      await axios.post(`${API_URL}/notifications`, payload, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })
      router.push('/notifications')
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to create notification')
    } finally {
      setLoading(false)
    }
  }

  if (authLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-6">
        <button
          onClick={() => router.back()}
          className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
        >
          <FiArrowLeft />
          <span>Back</span>
        </button>

        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Create Notification</h1>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Title *
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Enter notification title"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Content *
              </label>
              <textarea
                name="content"
                value={formData.content}
                onChange={handleChange}
                required
                rows={8}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Enter notification content"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category *
                </label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                >
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
                  Priority *
                </label>
                <select
                  name="priority"
                  value={formData.priority}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                >
                  <option value="Emergency">Emergency</option>
                  <option value="High">High</option>
                  <option value="Normal">Normal</option>
                  <option value="Info">Info</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Department
                </label>
                <select
                  name="department_id"
                  value={formData.department_id}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">All Departments</option>
                  {departments.map((dept) => (
                    <option key={dept.id} value={dept.id}>
                      {dept.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Year
                </label>
                <select
                  name="year"
                  value={formData.year}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">All Years</option>
                  <option value="1">1st Year</option>
                  <option value="2">2nd Year</option>
                  <option value="3">3rd Year</option>
                  <option value="4">4th Year</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Target Roles (Optional)
              </label>
              <div className="flex flex-wrap gap-2 p-3 border border-gray-300 rounded-lg max-h-40 overflow-y-auto">
                {roles.map(role => (
                  <button
                    key={role.id}
                    type="button"
                    onClick={() => toggleRole(role.id)}
                    className={`px-3 py-1 rounded-full text-sm font-medium transition-colors border ${formData.roles.includes(role.id)
                      ? 'bg-primary-100 text-primary-800 border-primary-500'
                      : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                      }`}
                  >
                    {role.name}
                  </button>
                ))}
                {roles.length === 0 && <span className="text-sm text-gray-500">No roles available.</span>}
              </div>
              <p className="text-xs text-gray-500 mt-1">Select roles to target specific groups (e.g. Placement, Sports).</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Schedule (Optional)
              </label>
              <input
                type="datetime-local"
                name="scheduled_at"
                value={formData.scheduled_at}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Attachment (Optional)
              </label>
              <input
                type="file"
                name="attachment"
                onChange={handleChange}
                accept=".jpg,.jpeg,.png,.pdf,.doc,.docx"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                Accepted formats: PDF, Word, Excel, Images (Max 10MB)
              </p>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                name="is_pinned"
                id="is_pinned"
                checked={formData.is_pinned}
                onChange={handleChange}
                className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
              />
              <label htmlFor="is_pinned" className="ml-2 text-sm text-gray-700">
                Pin this notification to the top
              </label>
            </div>

            <div className="flex items-center justify-end space-x-4 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={() => router.back()}
                className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Creating...' : 'Create Notification'}
              </button>
            </div>
          </form>
        </div >
      </div >
    </Layout >
  )
}
