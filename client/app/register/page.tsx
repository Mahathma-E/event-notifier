'use client'

import { useState, useEffect, Suspense } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import axios from 'axios'
import { auth as firebaseAuth } from '@/lib/firebase'
import { validatePassword } from '@/utils/passwordUtils'

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

    // Password Validation for new accounts
    if (!isCompletingProfile) {
      const { isValid, error: passError } = validatePassword(formData.password);
      if (!isValid && passError) {
        setError(passError);
        setLoading(false);
        return; // Stop registration
      }
    }

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
    <div className="min-h-screen flex items-center justify-center bg-black px-4 py-8">
      <div className="max-w-md w-full bg-[#16181c] rounded-xl border border-dark-border p-8 shadow-2xl">
        <div className="text-center mb-8">
          <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 overflow-hidden">
            <img src="/g-logo.png" alt="GCE Notify" className="w-full h-full object-cover scale-125" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2 tracking-tight">
            {isCompletingProfile ? 'Complete Your Profile' : 'Create Account'}
          </h1>
          <p className="text-[#71767b] text-sm">
            {isCompletingProfile ? 'Tell us a bit more about you' : 'Join GCE Smart Notify today'}
          </p>
        </div>

        {success ? (
          <div className="text-center p-6 bg-green-500/10 border border-green-500/20 rounded-lg">
            <div className="text-green-500 mb-4">
              <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Check Your Email</h2>
            <p className="text-[#71767b] mb-6">{success}</p>
            <Link
              href="/login"
              className="inline-block bg-primary-500 text-white px-6 py-2 rounded-full font-bold hover:bg-primary-600 transition-colors"
            >
              Go to Login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-500 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <div>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 bg-black border border-dark-border rounded-lg text-white focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-colors placeholder-[#71767b]"
                placeholder="Full Name"
              />
            </div>

            <div>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                disabled={isCompletingProfile}
                className="w-full px-4 py-3 bg-black border border-dark-border rounded-lg text-white focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-colors placeholder-[#71767b] disabled:opacity-50 disabled:cursor-not-allowed"
                placeholder="Email Address"
              />
            </div>

            {!isCompletingProfile && (
              <div>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  minLength={6}
                  className="w-full px-4 py-3 bg-black border border-dark-border rounded-lg text-white focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-colors placeholder-[#71767b]"
                  placeholder="Password"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-[#71767b] mb-2 uppercase tracking-wide">
                Role
              </label>
              <select
                name="role"
                value={formData.role}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 bg-black border border-dark-border rounded-lg text-white focus:outline-none focus:border-primary-500 transition-colors"
              >
                <option value="student">Student</option>
                <option value="faculty">Faculty</option>
              </select>
            </div>

            {formData.role !== 'admin' && (
              <>
                <div>
                  <label className="block text-xs font-bold text-[#71767b] mb-2 uppercase tracking-wide">
                    Department
                  </label>
                  <select
                    name="department_id"
                    value={formData.department_id}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-black border border-dark-border rounded-lg text-white focus:outline-none focus:border-primary-500 transition-colors"
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
                    <label className="block text-xs font-bold text-[#71767b] mb-2 uppercase tracking-wide">
                      Year
                    </label>
                    <select
                      name="year"
                      value={formData.year}
                      onChange={handleChange}
                      className="w-full px-4 py-3 bg-black border border-dark-border rounded-lg text-white focus:outline-none focus:border-primary-500 transition-colors"
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
                      <label className="block text-xs font-bold text-[#71767b] mb-2 uppercase tracking-wide">
                        Designation <span className="text-[#536471] font-normal lowercase">(optional)</span>
                      </label>
                      <select
                        name="designation"
                        value={formData.designation}
                        onChange={handleChange}
                        className="w-full px-4 py-3 bg-black border border-dark-border rounded-lg text-white focus:outline-none focus:border-primary-500 transition-colors"
                      >
                        <option value="">Teaching Staff</option>
                        <option value="coordinator">Coordinator</option>
                        <option value="hod">HOD</option>
                      </select>
                    </div>

                    <div>
                      <input
                        type="text"
                        name="subjects"
                        value={formData.subjects}
                        onChange={handleChange}
                        placeholder="Subjects (e.g. Data Structures)"
                        className="w-full px-4 py-3 bg-black border border-dark-border rounded-lg text-white focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-colors placeholder-[#71767b]"
                      />
                    </div>
                  </>
                )}
              </>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-white text-black py-2.5 px-4 rounded-full hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-black disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-bold mt-6"
            >
              {loading ? 'Processing...' : (isCompletingProfile ? 'Save Profile' : 'Create Account')}
            </button>
          </form>
        )
        }

        <div className="mt-8 text-center">
          <p className="text-sm text-[#71767b]">
            {isCompletingProfile ? 'Want to sign out?' : 'Already have an account?'}
            {' '}
            <Link href="/login" className="text-primary-500 hover:text-primary-400 font-medium hover:underline">
              {isCompletingProfile ? 'Back to Login' : 'Sign in'}
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
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    }>
      <RegisterForm />
    </Suspense>
  )
}
