'use client'

import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import Layout from '@/components/Layout'
import axios from 'axios'
import Cookies from 'js-cookie'
import { FiArrowLeft } from 'react-icons/fi'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'

export default function NewODRequestPage() {
    const { user } = useAuth()
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [formData, setFormData] = useState({
        reason: '',
        start_date: '',
        end_date: '',
        total_days: 1,
    })

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            const token = Cookies.get('token')
            if (token) {
                axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
            }

            await axios.post(`${API_URL}/od`, formData)
            router.push('/od')
        } catch (error) {
            console.error('Failed to submit OD request:', error)
            alert('Failed to submit request')
        } finally {
            setLoading(false)
        }
    }

    return (
        <Layout>
            <div className="max-w-2xl mx-auto space-y-6">
                <button
                    onClick={() => router.back()}
                    className="flex items-center space-x-2 text-[#71767b] hover:text-white transition-colors group"
                >
                    <FiArrowLeft className="group-hover:-translate-x-1 transition-transform" />
                    <span>Back</span>
                </button>

                <h1 className="text-3xl font-bold text-white tracking-tight">Request On-Duty (OD)</h1>

                <form onSubmit={handleSubmit} className="bg-[#16181c] rounded-xl border border-dark-border p-8 shadow-sm space-y-6">
                    <div>
                        <label className="block text-sm font-bold text-[#71767b] mb-2 uppercase tracking-wide">Reason / Purpose</label>
                        <textarea
                            required
                            className="w-full px-4 py-3 bg-black border border-dark-border rounded-lg text-white focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-colors h-32 placeholder-[#71767b]"
                            placeholder="E.g., Participation in Inter-college Symposium, Sports Meet, etc."
                            value={formData.reason}
                            onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-bold text-[#71767b] mb-2 uppercase tracking-wide">Start Date</label>
                            <input
                                type="date"
                                required
                                className="w-full px-4 py-3 bg-black border border-dark-border rounded-lg text-white focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-colors [color-scheme:dark]"
                                value={formData.start_date}
                                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-[#71767b] mb-2 uppercase tracking-wide">End Date</label>
                            <input
                                type="date"
                                required
                                className="w-full px-4 py-3 bg-black border border-dark-border rounded-lg text-white focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-colors [color-scheme:dark]"
                                value={formData.end_date}
                                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-[#71767b] mb-2 uppercase tracking-wide">Total Days</label>
                        <input
                            type="number"
                            min="1"
                            required
                            className="w-full px-4 py-3 bg-black border border-dark-border rounded-lg text-white focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-colors"
                            value={formData.total_days}
                            onChange={(e) => setFormData({ ...formData, total_days: parseInt(e.target.value) })}
                        />
                    </div>

                    <div className="pt-4">
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-primary-500 text-white py-3 px-4 rounded-full font-bold hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-black disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg shadow-primary-500/20"
                        >
                            {loading ? 'Submitting...' : 'Submit Request'}
                        </button>
                    </div>
                </form>
            </div>
        </Layout>
    )
}
