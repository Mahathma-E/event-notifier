'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import Layout from '@/components/Layout'
import axios from 'axios'
import Cookies from 'js-cookie'
import { FiPlus, FiClock, FiCheckCircle, FiXCircle, FiDownload } from 'react-icons/fi'
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
                return <span className="px-2.5 py-1 text-xs font-bold rounded bg-green-500/10 text-green-500 border border-green-500/20 uppercase tracking-wide">Approved</span>
            case 'rejected':
                return <span className="px-2.5 py-1 text-xs font-bold rounded bg-red-500/10 text-red-500 border border-red-500/20 uppercase tracking-wide">Rejected</span>
            case 'pending_coordinator':
                return <span className="px-2.5 py-1 text-xs font-bold rounded bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 uppercase tracking-wide">Pending Coordinator</span>
            case 'pending_hod':
                return <span className="px-2.5 py-1 text-xs font-bold rounded bg-blue-500/10 text-blue-500 border border-blue-500/20 uppercase tracking-wide">Pending HOD</span>
            default:
                return <span className="px-2.5 py-1 text-xs font-bold rounded bg-gray-500/10 text-gray-500 border border-gray-500/20 uppercase tracking-wide">{status}</span>
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
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
                </div>
            </Layout>
        )
    }

    return (
        <Layout>
            <div className="max-w-[1200px] mx-auto p-4 sm:p-6 space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-white tracking-tight">OD Requests</h1>
                        <p className="text-[#71767b] mt-1">Manage and track on-duty requests.</p>
                    </div>

                    <div className="flex space-x-3">
                        {user?.role !== 'student' && (
                            <button
                                onClick={exportReport}
                                className="flex items-center gap-2 bg-[#202327] border border-dark-border text-white px-4 py-2 rounded-full font-bold hover:bg-[#2f3336] transition-colors"
                            >
                                <FiDownload className="w-5 h-5" />
                                <span>Export Report</span>
                            </button>
                        )}
                        {user?.role === 'student' && (
                            <button
                                onClick={() => router.push('/od/request')}
                                className="flex items-center gap-2 bg-primary-500 text-white px-4 py-2 rounded-full font-bold hover:bg-primary-600 transition-colors shadow-lg shadow-primary-500/20"
                            >
                                <FiPlus className="w-5 h-5" />
                                <span>New Request</span>
                            </button>
                        )}
                    </div>
                </div>

                <div className="bg-[#16181c] rounded-xl border border-dark-border overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-[#202327]/50 border-b border-dark-border">
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-[#71767b] uppercase tracking-wider">
                                        Student
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-[#71767b] uppercase tracking-wider w-1/3">
                                        Reason
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-[#71767b] uppercase tracking-wider">
                                        Dates
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-[#71767b] uppercase tracking-wider">
                                        Status
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-[#71767b] uppercase tracking-wider">
                                        Action
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-dark-border">
                                {requests.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-20 text-center text-[#71767b]">
                                            <div className="flex flex-col items-center">
                                                <FiClock className="w-10 h-10 mb-2 opacity-50" />
                                                <p className="font-medium">No OD requests found</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    requests.map((request) => (
                                        <tr key={request.id} className="hover:bg-[#202327] transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center text-white text-xs font-bold border border-dark-border">
                                                        {request.user_name.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <div className="text-sm font-bold text-white">{request.user_name}</div>
                                                        <div className="text-xs text-[#71767b]">{request.department_name}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-sm text-[#dbebec] line-clamp-2 max-w-xs">{request.reason}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-[#71767b]">
                                                <div className="font-medium text-white">{format(new Date(request.start_date), 'MMM d, yyyy')}</div>
                                                <div className="text-xs mt-0.5">{request.total_days} days • To {format(new Date(request.end_date), 'MMM d')}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {getStatusBadge(request.status)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                <div className="flex items-center gap-3">
                                                    <button
                                                        onClick={() => router.push(`/od/${request.id}`)}
                                                        className="text-primary-500 hover:text-primary-400 font-bold hover:underline"
                                                    >
                                                        View
                                                    </button>
                                                    {user?.role === 'student' &&
                                                        (request.status === 'pending_coordinator' || request.status === 'pending_hod') && (
                                                            <button
                                                                onClick={async (e) => {
                                                                    e.stopPropagation();
                                                                    if (confirm('Are you sure you want to delete this pending request?')) {
                                                                        try {
                                                                            const token = Cookies.get('token');
                                                                            if (token) axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
                                                                            await axios.delete(`${API_URL}/od/${request.id}`);
                                                                            setRequests(requests.filter(r => r.id !== request.id));
                                                                        } catch (err) {
                                                                            alert('Failed to delete request');
                                                                        }
                                                                    }
                                                                }}
                                                                className="text-red-500 hover:text-red-400 font-bold hover:underline"
                                                            >
                                                                Delete
                                                            </button>
                                                        )}
                                                </div>
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
