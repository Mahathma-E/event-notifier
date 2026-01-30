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
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
                </div>
            </Layout>
        )
    }

    if (!user) return null

    return (
        <Layout>
            <div className="max-w-[800px] mx-auto space-y-8 p-4 sm:p-6">
                <h1 className="text-3xl font-bold text-white tracking-tight">My Profile</h1>

                {message && (
                    <div className={`p-4 rounded-xl border ${message.type === 'success'
                        ? 'bg-green-500/10 border-green-500/20 text-green-500'
                        : 'bg-red-500/10 border-red-500/20 text-red-500'}`}>
                        {message.text}
                    </div>
                )}

                <div className="bg-[#16181c] rounded-xl border border-dark-border overflow-hidden">
                    <div className="p-8 border-b border-dark-border bg-[#1d1f23]/50 flex items-center space-x-6">
                        <div className="h-24 w-24 bg-gradient-to-br from-primary-500 to-primary-700 rounded-full flex items-center justify-center text-white text-4xl font-bold shadow-lg shadow-primary-500/20 border-4 border-[#16181c]">
                            {user.name?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-white">{user.name}</h2>
                            <span className="inline-block mt-1 px-3 py-1 bg-[#2f3336] rounded-full text-sm font-medium text-[#71767b] capitalize border border-dark-border">
                                {user.role}
                            </span>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="p-8 space-y-8">
                        {/* Name (Editable) */}
                        <div>
                            <label className="block text-sm font-bold text-[#71767b] mb-2 uppercase tracking-wide">
                                <div className="flex items-center space-x-2">
                                    <FiUser />
                                    <span>Full Name</span>
                                </div>
                            </label>
                            <input
                                type="text"
                                required
                                className="w-full px-4 py-3 bg-black border border-dark-border rounded-lg text-white focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-colors"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            />
                        </div>

                        {/* Email (Read-only) */}
                        <div>
                            <label className="block text-sm font-bold text-[#71767b] mb-2 uppercase tracking-wide">
                                <div className="flex items-center space-x-2">
                                    <FiMail />
                                    <span>Email Address</span>
                                </div>
                            </label>
                            <input
                                type="email"
                                disabled
                                className="w-full px-4 py-3 bg-[#202327] border border-dark-border rounded-lg text-[#71767b] cursor-not-allowed"
                                value={user.email}
                            />
                            <p className="mt-2 text-xs text-[#71767b]">Email cannot be changed.</p>
                        </div>

                        {/* Department & Role Info (Read-only) */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div>
                                <label className="block text-sm font-bold text-[#71767b] mb-2 uppercase tracking-wide">
                                    <div className="flex items-center space-x-2">
                                        <FiBriefcase />
                                        <span>Department</span>
                                    </div>
                                </label>
                                <div className="px-4 py-3 border border-dark-border rounded-lg bg-[#202327] text-white">
                                    {user.department_name || 'N/A'}
                                </div>
                            </div>

                            {user.role === 'student' && user.year && (
                                <div>
                                    <label className="block text-sm font-bold text-[#71767b] mb-2 uppercase tracking-wide">Year</label>
                                    <div className="px-4 py-3 border border-dark-border rounded-lg bg-[#202327] text-white">
                                        Year {user.year}
                                    </div>
                                </div>
                            )}

                            {user.role === 'faculty' && user.designation && (
                                <div>
                                    <label className="block text-sm font-bold text-[#71767b] mb-2 uppercase tracking-wide">Designation</label>
                                    <div className="px-4 py-3 border border-dark-border rounded-lg bg-[#202327] text-white capitalize">
                                        {user.designation}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Subjects (Editable for Faculty) */}
                        {user.role === 'faculty' && (
                            <div>
                                <label className="block text-sm font-bold text-[#71767b] mb-2 uppercase tracking-wide">
                                    <div className="flex items-center space-x-2">
                                        <FiBook />
                                        <span>Subjects Handling</span>
                                    </div>
                                </label>
                                <textarea
                                    className="w-full px-4 py-3 bg-black border border-dark-border rounded-lg text-white focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 h-32 transition-colors placeholder-[#71767b]"
                                    value={formData.subjects}
                                    onChange={(e) => setFormData({ ...formData, subjects: e.target.value })}
                                    placeholder="E.g., Data Structures, Algorithms, Operating Systems"
                                />
                                <p className="mt-2 text-xs text-[#71767b]">List the subjects you are currently teaching.</p>
                            </div>
                        )}

                        <div className="pt-6 flex justify-end border-t border-dark-border">
                            <button
                                type="submit"
                                disabled={submitting}
                                className="flex items-center space-x-2 bg-primary-500 text-white px-8 py-2.5 rounded-full font-bold hover:bg-primary-600 transition-colors disabled:opacity-50 shadow-lg shadow-primary-500/20"
                            >
                                {submitting ? (
                                    <span>Saving...</span>
                                ) : (
                                    <>
                                        <FiSave />
                                        <span>Save Changes</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </Layout>
    )
}
