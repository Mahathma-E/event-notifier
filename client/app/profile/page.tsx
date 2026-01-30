'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import Layout from '@/components/Layout'
import axios from 'axios'
import Cookies from 'js-cookie'
import { FiSave, FiUser, FiMail, FiBriefcase, FiBook } from 'react-icons/fi'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'

export default function ProfilePage() {
    const { user, updateUser, loading: authLoading } = useAuth()
    const [loading, setLoading] = useState(true)
    const [submitting, setSubmitting] = useState(false)
    const [formData, setFormData] = useState({
        name: '',
        subjects: '',
    })
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

    useEffect(() => {
        if (user) {
            setFormData({
                name: user.name || '',
                subjects: user.subjects || '',
            })
            setLoading(false)
        }
    }, [user])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!user) return

        setSubmitting(true)
        setMessage(null)

        try {
            const token = Cookies.get('token')
            if (token) {
                axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
            }

            const response = await axios.put(`${API_URL}/users/${user.id}`, {
                name: formData.name,
                subjects: user.role === 'faculty' ? formData.subjects : undefined,
            })

            updateUser(response.data.user)
            setMessage({ type: 'success', text: 'Profile updated successfully' })
        } catch (error) {
            console.error('Failed to update profile:', error)
            setMessage({ type: 'error', text: 'Failed to update profile' })
        } finally {
            setSubmitting(false)
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

    if (!user) return null

    return (
        <Layout>
            <div className="max-w-2xl mx-auto space-y-6">
                <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>

                {message && (
                    <div className={`p-4 rounded-lg ${message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {message.text}
                    </div>
                )}

                <div className="bg-white rounded-lg shadow overflow-hidden">
                    <div className="p-6 border-b border-gray-200 bg-gray-50 flex items-center space-x-4">
                        <div className="h-16 w-16 bg-primary-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                            {user.name?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <h2 className="text-xl font-semibold text-gray-900">{user.name}</h2>
                            <p className="text-sm text-gray-500 capitalize">{user.role}</p>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="p-6 space-y-6">
                        {/* Name (Editable) */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                <div className="flex items-center space-x-2">
                                    <FiUser className="text-gray-400" />
                                    <span>Full Name</span>
                                </div>
                            </label>
                            <input
                                type="text"
                                required
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            />
                        </div>

                        {/* Email (Read-only) */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                <div className="flex items-center space-x-2">
                                    <FiMail className="text-gray-400" />
                                    <span>Email Address</span>
                                </div>
                            </label>
                            <input
                                type="email"
                                disabled
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
                                value={user.email}
                            />
                            <p className="mt-1 text-xs text-gray-400">Email cannot be changed.</p>
                        </div>

                        {/* Department & Role Info (Read-only) */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    <div className="flex items-center space-x-2">
                                        <FiBriefcase className="text-gray-400" />
                                        <span>Department</span>
                                    </div>
                                </label>
                                <div className="px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-700">
                                    {user.department_name || 'N/A'}
                                </div>
                            </div>

                            {user.role === 'student' && user.year && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Year</label>
                                    <div className="px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-700">
                                        Year {user.year}
                                    </div>
                                </div>
                            )}

                            {user.role === 'faculty' && user.designation && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Designation</label>
                                    <div className="px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-700 capitalize">
                                        {user.designation}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Subjects (Editable for Faculty) */}
                        {user.role === 'faculty' && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    <div className="flex items-center space-x-2">
                                        <FiBook className="text-gray-400" />
                                        <span>Subjects Handling</span>
                                    </div>
                                </label>
                                <textarea
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 h-24"
                                    value={formData.subjects}
                                    onChange={(e) => setFormData({ ...formData, subjects: e.target.value })}
                                    placeholder="E.g., Data Structures, Algorithms, Operating Systems"
                                />
                                <p className="mt-1 text-xs text-gray-500">List the subjects you are currently teaching.</p>
                            </div>
                        )}

                        <div className="pt-4 flex justify-end">
                            <button
                                type="submit"
                                disabled={submitting}
                                className="flex items-center space-x-2 bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50"
                            >
                                <FiSave />
                                <span>{submitting ? 'Saving...' : 'Save Changes'}</span>
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </Layout>
    )
}
