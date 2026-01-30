'use client'

import { useState, useEffect, Suspense } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import axios from 'axios'
import { auth as firebaseAuth } from '@/lib/firebase'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'

function RegisterForm() {
  const searchParams = useSearchParams()
  const isCompletingProfile = searchParams.get('complete_profile') === 'true'

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    role: 'student' as 'admin' | 'faculty' | 'student',
    department_id: '',
    year: '',
    designation: '',
    subjects: '',
  })
  const [departments, setDepartments] = useState<any[]>([])
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)
  const { register } = useAuth()
  const router = useRouter()

  useEffect(() => {
    fetchDepartments()

    // If completing Google profile, pre-fill from Firebase
    if (isCompletingProfile && firebaseAuth.currentUser) {
      setFormData(prev => ({
        ...prev,
        email: firebaseAuth.currentUser?.email || '',
        name: firebaseAuth.currentUser?.displayName || '',
      }))
    }
  }, [isCompletingProfile])

  const fetchDepartments = async () => {
    try {
      const response = await axios.get(`${API_URL}/departments`)
      setDepartments(response.data.departments)
    } catch (error) {
      console.error('Failed to fetch departments')
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)

    try {
      if (isCompletingProfile) {
        // If Google user, they just need to sync with PostgreSQL
        await axios.post(`${API_URL}/auth/register`, {
          email: formData.email,
          name: formData.name,
          role: formData.role,
          department_id: formData.department_id ? parseInt(formData.department_id) : undefined,
          year: formData.year ? parseInt(formData.year) : undefined,
          designation: formData.designation || undefined,
          subjects: formData.subjects || undefined,
          firebase_uid: firebaseAuth.currentUser?.uid
        })
        router.push('/dashboard')
      } else {
        // Normal registration
        await register({
          email: formData.email,
          password: formData.password,
          name: formData.name,
          role: formData.role,
          department_id: formData.department_id ? parseInt(formData.department_id) : undefined,
          year: formData.year ? parseInt(formData.year) : undefined,
          designation: formData.designation || undefined,
          subjects: formData.subjects || undefined,
        })
      }
    } catch (err: any) {
      if (err.message.includes('success')) {
        setSuccess(err.message)
      } else {
        setError(err.message || 'Registration failed')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100 px-4 py-8">
      <div className="max-w-md w-full bg-white rounded-lg shadow-xl p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-primary-700 mb-2">
            {isCompletingProfile ? 'Complete Your Profile' : 'Create Account'}
          </h1>
          <p className="text-gray-600">
            {isCompletingProfile ? 'Tell us a bit more about you' : 'Join GCE Smart Notify'}
          </p>
        </div>

        {success ? (
          <div className="text-center p-6 bg-green-50 border border-green-200 rounded-lg">
            <div className="text-green-600 mb-4">
              <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-green-800 mb-2">Check Your Email</h2>
            <p className="text-green-700 mb-6">{success}</p>
            <Link
              href="/login"
              className="inline-block bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors"
            >
              Go to Login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Name
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                disabled={isCompletingProfile}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-100 italic"
              />
            </div>

            {!isCompletingProfile && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Password
                </label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  minLength={6}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Role
              </label>
              <select
                name="role"
                value={formData.role}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="student">Student</option>
                <option value="faculty">Faculty</option>
              </select>
            </div>

            {formData.role !== 'admin' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Department
                  </label>
                  <select
                    name="department_id"
                    value={formData.department_id}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="">Select Department</option>
                    {departments.map((dept) => (
                      <option key={dept.id} value={dept.id}>
                        {dept.name}
                      </option>
                    ))}
                  </select>
                </div>

                {formData.role === 'student' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Year
                    </label>
                    <select
                      name="year"
                      value={formData.year}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    >
                      <option value="">Select Year</option>
                      <option value="1">1st Year</option>
                      <option value="2">2nd Year</option>
                      <option value="3">3rd Year</option>
                      <option value="4">4th Year</option>
                    </select>
                  </div>
                )}

                {formData.role === 'faculty' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Designation (Optional)
                      </label>
                      <select
                        name="designation"
                        value={formData.designation}
                        onChange={handleChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      >
                        <option value="">Teaching Staff</option>
                        <option value="coordinator">Coordinator</option>
                        <option value="hod">HOD</option>
                      </select>
                      <p className="text-xs text-gray-500 mt-1">Select only if you are a Coordinator or HOD.</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Subjects
                      </label>
                      <input
                        type="text"
                        name="subjects"
                        value={formData.subjects}
                        onChange={handleChange}
                        placeholder="e.g. Data Structures, Algorithms"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      />
                    </div>
                  </>
                )}
              </>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary-600 text-white py-2 px-4 rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium mt-4"
            >
              {loading ? 'Processing...' : (isCompletingProfile ? 'Save Profile' : 'Register')}
            </button>
          </form>
        )
        }

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            {isCompletingProfile ? 'Want to sign out?' : 'Already have an account?'}
            {' '}
            <Link href="/login" className="text-primary-600 hover:text-primary-700 font-medium">
              {isCompletingProfile ? 'Back to Login' : 'Login'}
            </Link>
          </p>
        </div>
      </div >
    </div >
  )
}

export default function RegisterPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    }>
      <RegisterForm />
    </Suspense>
  )
}
