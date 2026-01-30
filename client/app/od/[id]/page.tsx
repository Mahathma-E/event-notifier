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
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
                </div>
            </Layout>
        )
    }

    if (!request) {
        return (
            <Layout>
                <div className="text-center py-12">
                    <p className="text-gray-500">OD request not found</p>
                    <button onClick={() => router.push('/od')} className="mt-4 text-primary-600 font-medium">
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
                    className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
                >
                    <FiArrowLeft />
                    <span>Back to Requests</span>
                </button>

                <div className="bg-white rounded-lg shadow overflow-hidden">
                    <div className="p-6 border-b border-gray-200 flex justify-between items-center">
                        <h1 className="text-2xl font-bold text-gray-900">OD Request Details</h1>
                        <span className={`px-3 py-1 rounded-full text-sm font-semibold capitalize ${request.status === 'approved' ? 'bg-green-100 text-green-800' :
                            request.status === 'rejected' ? 'bg-red-100 text-red-800' :
                                'bg-yellow-100 text-yellow-800'
                            }`}>
                            {request.status}
                        </span>
                    </div>

                    <div className="p-6 space-y-6">
                        <div className="grid grid-cols-2 gap-6">
                            <div>
                                <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">Student Name</p>
                                <p className="mt-1 text-lg text-gray-900">{request.user_name}</p>
                                <p className="text-sm text-gray-500">{request.user_email}</p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">Department</p>
                                <p className="mt-1 text-lg text-gray-900">{request.department_name || '-'}</p>
                            </div>
                        </div>

                        <div>
                            <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">Period</p>
                            <p className="mt-1 text-lg text-gray-900">
                                {format(new Date(request.start_date), 'MMMM d, yyyy')} to {format(new Date(request.end_date), 'MMMM d, yyyy')}
                            </p>
                            <p className="text-sm text-gray-500">{request.total_days} day(s)</p>
                        </div>

                        <div>
                            <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">Reason / Purpose</p>
                            <div className="mt-2 p-4 bg-gray-50 rounded-lg text-gray-900 border border-gray-200">
                                {request.reason}
                            </div>
                        </div>

                        {request.comment && (
                            <div>
                                <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">Approver's Comment</p>
                                <div className="mt-2 p-4 bg-yellow-50 rounded-lg text-gray-900 border border-yellow-200 italic">
                                    "{request.comment}"
                                </div>
                                <p className="mt-2 text-xs text-gray-500">By {request.action_by_name}</p>
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
                                <div className="mt-8 pt-8 border-t border-gray-200 space-y-4">
                                    <h3 className="text-lg font-semibold text-gray-900">Take Action</h3>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Comment (Optional)</label>
                                        <textarea
                                            placeholder="Provide a reason for approval or rejection..."
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 h-24"
                                            value={comment}
                                            onChange={(e) => setComment(e.target.value)}
                                        />
                                    </div>
                                    <div className="flex space-x-4">
                                        <button
                                            onClick={() => handleStatusUpdate('approved')}
                                            disabled={submitting}
                                            className="flex-1 flex items-center justify-center space-x-2 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                                        >
                                            <FiCheck />
                                            <span>Approve</span>
                                        </button>
                                        <button
                                            onClick={() => handleStatusUpdate('rejected')}
                                            disabled={submitting}
                                            className="flex-1 flex items-center justify-center space-x-2 bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
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
