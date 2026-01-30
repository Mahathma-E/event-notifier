'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import Layout from '@/components/Layout'
import axios from 'axios'
import Cookies from 'js-cookie'
import { FiPlus, FiClock, FiCheckCircle, FiXCircle } from 'react-icons/fi'
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

export default function ODPage() {
    const { user, loading: authLoading } = useAuth()
    const router = useRouter()
    const [requests, setRequests] = useState<ODRequest[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/login')
        }
    }, [user, authLoading, router])

    useEffect(() => {
        if (user) {
            fetchRequests()
        }
    }, [user])

    const fetchRequests = async () => {
        try {
            setLoading(true)
            const token = Cookies.get('token')
            if (token) {
                axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
            }

            const response = await axios.get(`${API_URL}/od`)
            setRequests(response.data.odRequests)
        } catch (error) {
            console.error('Failed to fetch OD requests:', error)
        } finally {
            setLoading(false)
        }
    }

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'approved':
                return <span className="px-2 py-1 text-xs font-semibold rounded bg-green-100 text-green-800">Approved</span>
            case 'rejected':
                return <span className="px-2 py-1 text-xs font-semibold rounded bg-red-100 text-red-800">Rejected</span>
            case 'pending_coordinator':
                return <span className="px-2 py-1 text-xs font-semibold rounded bg-yellow-100 text-yellow-800">Pending Coordinator</span>
            case 'pending_hod':
                return <span className="px-2 py-1 text-xs font-semibold rounded bg-blue-100 text-blue-800">Pending HOD</span>
            default:
                return <span className="px-2 py-1 text-xs font-semibold rounded bg-gray-100 text-gray-800">{status}</span>
        }
    }

    const exportReport = () => {
        const approved = requests.filter(r => r.status === 'approved')
        if (approved.length === 0) {
            alert('No approved requests to export.')
            return
        }

        const csvContent = "data:text/csv;charset=utf-8,"
            + "Student Name,Department,Start Date,End Date,Total Days,Reason\n"
            + approved.map(r =>
                `"${r.user_name}","${r.department_name}","${format(new Date(r.start_date), 'yyyy-MM-dd')}","${format(new Date(r.end_date), 'yyyy-MM-dd')}","${r.total_days}","${r.reason.replace(/"/g, '""')}"`
            ).join("\n");

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "approved_od_report.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
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

    return (
        <Layout>
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <h1 className="text-3xl font-bold text-gray-900">OD Requests</h1>
                    <div className="flex space-x-2">
                        {user?.role !== 'student' && (
                            <button
                                onClick={exportReport}
                                className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                                </svg>
                                <span>Export Report</span>
                            </button>
                        )}
                        {user?.role === 'student' && (
                            <button
                                onClick={() => router.push('/od/request')}
                                className="flex items-center space-x-2 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors"
                            >
                                <FiPlus />
                                <span>New Request</span>
                            </button>
                        )}
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Student
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Reason
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Dates
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Status
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Action
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {requests.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                                            No OD requests found
                                        </td>
                                    </tr>
                                ) : (
                                    requests.map((request) => (
                                        <tr key={request.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-medium text-gray-900">{request.user_name}</div>
                                                <div className="text-xs text-gray-500">{request.department_name}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-sm text-gray-900 line-clamp-1">{request.reason}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {format(new Date(request.start_date), 'MMM d')} - {format(new Date(request.end_date), 'MMM d, yyyy')}
                                                <div className="text-xs">{request.total_days} days</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {getStatusBadge(request.status)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                <button
                                                    onClick={() => router.push(`/od/${request.id}`)}
                                                    className="text-primary-600 hover:text-primary-900"
                                                >
                                                    View Details
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </Layout>
    )
}
