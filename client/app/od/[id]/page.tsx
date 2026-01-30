'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import Layout from '@/components/Layout'
import axios from 'axios'
import Cookies from 'js-cookie'
import { FiArrowLeft, FiCheck, FiX } from 'react-icons/fi'
import { format } from 'date-fns'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'

interface ODRequest {
    id: number
    reason: string
    start_date: string
    end_date: string
    total_days: number
    status: 'pending_coordinator' | 'pending_hod' | 'approved' | 'rejected'
    comment?: string
    user_name: string
    user_email: string
    department_name?: string
    action_by_name?: string
    created_at: string
}

export default function ODDetailsPage() {
    const { id } = useParams()
    const { user } = useAuth()
    const router = useRouter()
    const [request, setRequest] = useState<ODRequest | null>(null)
    const [loading, setLoading] = useState(true)
    const [comment, setComment] = useState('')
    const [submitting, setSubmitting] = useState(false)

    useEffect(() => {
        fetchRequest()
    }, [id])

    const fetchRequest = async () => {
        try {
            const token = Cookies.get('token')
            if (token) {
                axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
            }

            const response = await axios.get(`${API_URL}/od`)
            const found = response.data.odRequests.find((r: ODRequest) => r.id === parseInt(id as string))
            setRequest(found || null)
        } catch (error) {
            console.error('Failed to fetch OD request:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleStatusUpdate = async (status: 'approved' | 'rejected') => {
        setSubmitting(true)
        try {
            const token = Cookies.get('token')
            if (token) {
                axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
            }

            await axios.patch(`${API_URL}/od/${id}/status`, { status, comment })
            fetchRequest()
        } catch (error) {
            console.error('Failed to update status:', error)
            alert('Failed to update status')
        } finally {
            setSubmitting(false)
        }
    }

    if (loading) {
        return (
            <Layout>
                <div className="flex items-center justify-center min-h-[40vh]">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
                </div>
            </Layout>
        )
    }

    if (!request) {
        return (
            <Layout>
                <div className="text-center py-20">
                    <p className="text-[#71767b] text-lg mb-4">OD request not found</p>
                    <button
                        onClick={() => router.push('/od')}
                        className="text-primary-500 font-bold hover:underline"
                    >
                        Go back to requests
                    </button>
                </div>
            </Layout>
        )
    }

    return (
        <Layout>
            <div className="max-w-3xl mx-auto space-y-6">
                <button
                    onClick={() => router.push('/od')}
                    className="flex items-center space-x-2 text-[#71767b] hover:text-white transition-colors group"
                >
                    <FiArrowLeft className="group-hover:-translate-x-1 transition-transform" />
                    <span>Back to Requests</span>
                </button>

                <div className="bg-[#16181c] rounded-xl border border-dark-border overflow-hidden shadow-sm">
                    <div className="p-6 sm:p-8 border-b border-dark-border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <h1 className="text-2xl font-bold text-white">OD Request Details</h1>
                        <span className={`px-3 py-1 rounded border text-xs font-bold uppercase tracking-wide ${request.status === 'approved'
                                ? 'bg-green-500/10 text-green-500 border-green-500/20'
                                : request.status === 'rejected'
                                    ? 'bg-red-500/10 text-red-500 border-red-500/20'
                                    : 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
                            }`}>
                            {request.status.replace('_', ' ')}
                        </span>
                    </div>

                    <div className="p-6 sm:p-8 space-y-8">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                            <div>
                                <p className="text-xs font-bold text-[#71767b] uppercase tracking-wide mb-1">Student Name</p>
                                <p className="text-lg font-bold text-white">{request.user_name}</p>
                                <p className="text-sm text-[#71767b]">{request.user_email}</p>
                            </div>
                            <div>
                                <p className="text-xs font-bold text-[#71767b] uppercase tracking-wide mb-1">Department</p>
                                <p className="text-lg font-bold text-white">{request.department_name || '-'}</p>
                            </div>
                        </div>

                        <div>
                            <p className="text-xs font-bold text-[#71767b] uppercase tracking-wide mb-1">Period</p>
                            <p className="text-lg font-bold text-white">
                                {format(new Date(request.start_date), 'MMMM d, yyyy')} <span className="text-[#71767b] mx-2">to</span> {format(new Date(request.end_date), 'MMMM d, yyyy')}
                            </p>
                            <p className="text-sm text-[#71767b] mt-1">{request.total_days} day(s)</p>
                        </div>

                        <div>
                            <p className="text-xs font-bold text-[#71767b] uppercase tracking-wide mb-2">Reason / Purpose</p>
                            <div className="p-4 bg-black rounded-lg text-[#dbebec] border border-dark-border">
                                {request.reason}
                            </div>
                        </div>

                        {request.comment && (
                            <div>
                                <p className="text-xs font-bold text-[#71767b] uppercase tracking-wide mb-2">Approver's Comment</p>
                                <div className="p-4 bg-[#2f3336]/30 rounded-lg text-[#dbebec] border border-dark-border italic">
                                    "{request.comment}"
                                </div>
                                <p className="mt-2 text-xs text-[#71767b]">By {request.action_by_name}</p>
                            </div>
                        )}

                        {/* Action Buttons Logic */}
                        {
                            (
                                (request.status === 'pending_coordinator' && user?.designation === 'coordinator') ||
                                (request.status === 'pending_hod' && user?.designation === 'hod') ||
                                (request.status === 'pending_coordinator' && user?.designation === 'hod') ||
                                (user?.role === 'admin' && (request.status === 'pending_coordinator' || request.status === 'pending_hod'))
                            ) && (
                                <div className="mt-8 pt-8 border-t border-dark-border space-y-4">
                                    <h3 className="text-lg font-bold text-white">Take Action</h3>
                                    <div>
                                        <label className="block text-xs font-bold text-[#71767b] mb-2 uppercase tracking-wide">Comment (Optional)</label>
                                        <textarea
                                            placeholder="Provide a reason for approval or rejection..."
                                            className="w-full px-4 py-3 bg-black border border-dark-border rounded-lg text-white focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-colors h-24 placeholder-[#71767b]"
                                            value={comment}
                                            onChange={(e) => setComment(e.target.value)}
                                        />
                                    </div>
                                    <div className="flex gap-4 pt-2">
                                        <button
                                            onClick={() => handleStatusUpdate('approved')}
                                            disabled={submitting}
                                            className="flex-1 flex items-center justify-center space-x-2 bg-green-500 text-white py-3 px-4 rounded-full font-bold hover:bg-green-600 transition-colors disabled:opacity-50 shadow-lg shadow-green-500/20"
                                        >
                                            <FiCheck />
                                            <span>Approve</span>
                                        </button>
                                        <button
                                            onClick={() => handleStatusUpdate('rejected')}
                                            disabled={submitting}
                                            className="flex-1 flex items-center justify-center space-x-2 bg-red-500 text-white py-3 px-4 rounded-full font-bold hover:bg-red-600 transition-colors disabled:opacity-50 shadow-lg shadow-red-500/20"
                                        >
                                            <FiX />
                                            <span>Reject</span>
                                        </button>
                                    </div>
                                </div>
                            )
                        }
                    </div>
                </div>
            </div>
        </Layout>
    )
}
