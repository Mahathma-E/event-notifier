'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import Layout from '@/components/Layout'
import axios from 'axios'
import Cookies from 'js-cookie'
import { FiArrowLeft, FiImage, FiCalendar, FiTarget } from 'react-icons/fi'

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
      <div className="max-w-[800px] mx-auto space-y-6 p-4 sm:p-6">
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => router.back()}
            className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-[#202327] text-white transition-colors"
          >
            <FiArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-2xl font-bold text-white tracking-tight">Create Notification</h1>
        </div>

        <div className="bg-[#16181c] rounded-xl border border-dark-border p-6 sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-[#71767b] mb-2 uppercase tracking-wide">
                Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 bg-black border border-dark-border rounded-lg text-white placeholder-[#71767b] focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-colors"
                placeholder="Enter notification title"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-[#71767b] mb-2 uppercase tracking-wide">
                Content <span className="text-red-500">*</span>
              </label>
              <textarea
                name="content"
                value={formData.content}
                onChange={handleChange}
                required
                rows={6}
                className="w-full px-4 py-3 bg-black border border-dark-border rounded-lg text-white placeholder-[#71767b] focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-colors"
                placeholder="Enter notification content"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-bold text-[#71767b] mb-2 uppercase tracking-wide">
                  Category <span className="text-red-500">*</span>
                </label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 bg-black border border-dark-border rounded-lg text-white focus:outline-none focus:border-primary-500 transition-colors"
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
                <label className="block text-sm font-bold text-[#71767b] mb-2 uppercase tracking-wide">
                  Priority <span className="text-red-500">*</span>
                </label>
                <select
                  name="priority"
                  value={formData.priority}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 bg-black border border-dark-border rounded-lg text-white focus:outline-none focus:border-primary-500 transition-colors"
                >
                  <option value="Emergency">Emergency</option>
                  <option value="High">High</option>
                  <option value="Normal">Normal</option>
                  <option value="Info">Info</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-bold text-[#71767b] mb-2 uppercase tracking-wide">
                  Department
                </label>
                <select
                  name="department_id"
                  value={formData.department_id}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-black border border-dark-border rounded-lg text-white focus:outline-none focus:border-primary-500 transition-colors"
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
                <label className="block text-sm font-bold text-[#71767b] mb-2 uppercase tracking-wide">
                  Year
                </label>
                <select
                  name="year"
                  value={formData.year}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-black border border-dark-border rounded-lg text-white focus:outline-none focus:border-primary-500 transition-colors"
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
              <label className="block text-sm font-bold text-[#71767b] mb-2 uppercase tracking-wide flex items-center gap-2">
                <FiTarget /> Target Roles (Optional)
              </label>
              <div className="flex flex-wrap gap-2 p-4 bg-black border border-dark-border rounded-lg max-h-40 overflow-y-auto">
                {roles.map(role => (
                  <button
                    key={role.id}
                    type="button"
                    onClick={() => toggleRole(role.id)}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold transition-colors border ${formData.roles.includes(role.id)
                      ? 'bg-primary-500/20 text-primary-500 border-primary-500'
                      : 'bg-[#16181c] text-[#71767b] border-dark-border hover:bg-[#202327] hover:text-white'
                      }`}
                  >
                    {role.name}
                  </button>
                ))}
                {roles.length === 0 && <span className="text-sm text-[#71767b]">No roles available.</span>}
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-[#71767b] mb-2 uppercase tracking-wide flex items-center gap-2">
                <FiCalendar /> Schedule (Optional)
              </label>
              <input
                type="datetime-local"
                name="scheduled_at"
                value={formData.scheduled_at}
                onChange={handleChange}
                min={new Date().toISOString().slice(0, 16)}
                className="w-full px-4 py-3 bg-black border border-dark-border rounded-lg text-white focus:outline-none focus:border-primary-500 transition-colors [color-scheme:dark]"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-[#71767b] mb-2 uppercase tracking-wide flex items-center gap-2">
                <FiImage /> Attachment (Optional)
              </label>
              <div className="relative">
                <input
                  type="file"
                  name="attachment"
                  onChange={handleChange}
                  accept=".jpg,.jpeg,.png,.pdf,.doc,.docx"
                  className="w-full px-4 py-3 bg-black border border-dark-border rounded-lg text-white focus:outline-none focus:border-primary-500 transition-colors file:mr-4 file:py-1 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-[#202327] file:text-white hover:file:bg-[#2f3336]"
                />
              </div>
              <p className="text-xs text-[#71767b] mt-2">
                Accepted formats: PDF, Word, Excel, Images (Max 10MB)
              </p>
            </div>

            <div className="flex items-center bg-[#202327]/50 p-4 rounded-lg border border-dark-border">
              <input
                type="checkbox"
                name="is_pinned"
                id="is_pinned"
                checked={formData.is_pinned}
                onChange={handleChange}
                className="w-4 h-4 text-primary-500 bg-black border-dark-border rounded focus:ring-primary-500 focus:ring-offset-black"
              />
              <label htmlFor="is_pinned" className="ml-3 text-sm font-medium text-white cursor-pointer select-none">
                Pin this notification to the top
              </label>
            </div>

            <div className="flex items-center justify-end space-x-4 pt-6 border-t border-dark-border">
              <button
                type="button"
                onClick={() => router.back()}
                className="px-6 py-2.5 rounded-full font-bold text-white hover:bg-[#202327] transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-8 py-2.5 bg-white text-black rounded-full font-bold hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-black disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Creating...' : 'Post'}
              </button>
            </div>
          </form>
        </div >
      </div >
    </Layout >
  )
}
