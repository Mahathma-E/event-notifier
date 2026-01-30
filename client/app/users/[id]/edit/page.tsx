'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import Layout from '@/components/Layout'
import axios from 'axios'
import Cookies from 'js-cookie'
import { FiArrowLeft } from 'react-icons/fi'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'

export default function EditUserPage() {
    const { id } = useParams()
    const { user: currentUser } = useAuth()
    const router = useRouter()
    const [loading, setLoading] = useState(true)
    const [submitting, setSubmitting] = useState(false)
    const [departments, setDepartments] = useState<any[]>([])
    const [userRole, setUserRole] = useState<string>('')
    const [formData, setFormData] = useState({
        name: '',
        department_id: '',
        year: '',
        designation: '',
        subjects: '',
    })

    useEffect(() => {
        if (currentUser?.role !== 'admin') {
            router.push('/dashboard')
            return
        }
        fetchData()
    }, [id])

    const fetchData = async () => {
        try {
            const token = Cookies.get('token')
            if (token) {
                axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
            }

            const [userRes, deptRes] = await Promise.all([
                axios.get(`${API_URL}/users/${id}`),
                axios.get(`${API_URL}/departments`)
            ])

            const user = userRes.data.user
            setUserRole(user.role)
            setFormData({
                name: user.name,
                department_id: user.department_id?.toString() || '',
                year: user.year?.toString() || '',
                designation: user.designation || '',
                subjects: user.subjects || '',
            })
            setDepartments(deptRes.data.departments)
        } catch (error) {
            console.error('Failed to fetch data:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setSubmitting(true)

        try {
            const token = Cookies.get('token')
            if (token) {
                axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
            }

            await axios.put(`${API_URL}/users/${id}`, {
                ...formData,
                department_id: formData.department_id ? parseInt(formData.department_id) : null,
                year: formData.year ? parseInt(formData.year) : null,
                designation: formData.designation || null,
                subjects: formData.subjects || null,
            })
            router.push('/users')
        } catch (error: any) {
            console.error('Failed to update user:', error)
            const message = error.response?.data?.message || error.response?.data?.errors?.[0]?.msg || 'Failed to update user'
            alert(message)
        } finally {
            setSubmitting(false)
        }
    }

    if (loading) {
        return (
            <Layout>
                <div className="flex items-center justify-center min-h-[40vh]">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
                </div>
            </Layout>
        )
    }

    return (
        <Layout>
            <div className="max-w-2xl mx-auto space-y-6">
                <button
                    onClick={() => router.back()}
                    className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
                >
                    <FiArrowLeft />
                    <span>Back</span>
                </button>

                <h1 className="text-3xl font-bold text-gray-900">Edit User Profile</h1>

                <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                        <input
                            type="text"
                            required
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Department</label>
                        <select
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                            value={formData.department_id}
                            onChange={(e) => setFormData({ ...formData, department_id: e.target.value })}
                        >
                            <option value="">Select Department</option>
                            {departments.map((dept) => (
                                <option key={dept.id} value={dept.id}>{dept.name}</option>
                            ))}
                        </select>
                    </div>

                    {userRole === 'student' && (
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Year</label>
                                <select
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                                    value={formData.year}
                                    onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                                >
                                    <option value="">Select Year</option>
                                    <option value="1">1st Year</option>
                                    <option value="2">2nd Year</option>
                                    <option value="3">3rd Year</option>
                                    <option value="4">4th Year</option>
                                </select>
                            </div>
                        </div>
                    )}

                    {userRole === 'faculty' && (
                        <>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Designation
                                </label>
                                <select
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                                    value={formData.designation}
                                    onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                                >
                                    <option value="">Teaching Staff</option>
                                    <option value="coordinator">Coordinator</option>
                                    <option value="hod">HOD</option>
                                </select>
                                <p className="text-xs text-gray-500 mt-1">Assign 'Coordinator' or 'HOD' role privileges.</p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Subjects
                                </label>
                                <input
                                    type="text"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                                    value={formData.subjects}
                                    onChange={(e) => setFormData({ ...formData, subjects: e.target.value })}
                                    placeholder="e.g. Data Structures, Algorithms"
                                />
                            </div>
                        </>
                    )}

                    <div className="pt-4">
                        <button
                            type="submit"
                            disabled={submitting}
                            className="w-full bg-primary-600 text-white py-2 px-4 rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50"
                        >
                            {submitting ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </form>
            </div >
        </Layout >
    )
}
