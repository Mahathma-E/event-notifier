'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import Layout from '@/components/Layout'
import axios from 'axios'
import Cookies from 'js-cookie'
import { FiPlus, FiEdit2, FiTrash2, FiX, FiCheck } from 'react-icons/fi'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'

interface Role {
    id: number
    name: string
    color: string
    description: string
    is_public: boolean
}

export default function RolesPage() {
    const { user, loading: authLoading } = useAuth()
    const [roles, setRoles] = useState<Role[]>([])
    const [loading, setLoading] = useState(true)
    const [showModal, setShowModal] = useState(false)
    const [editingRole, setEditingRole] = useState<Role | null>(null)

    // Form State
    const [formData, setFormData] = useState({
        name: '',
        color: '#3B82F6',
        description: '',
        is_public: false
    })

    useEffect(() => {
        if (user && user.role === 'admin') {
            fetchRoles()
        }
    }, [user])

    const fetchRoles = async () => {
        try {
            setLoading(true)
            const token = Cookies.get('token')
            if (token) axios.defaults.headers.common['Authorization'] = `Bearer ${token}`

            const response = await axios.get(`${API_URL}/roles`)
            setRoles(response.data)
        } catch (error) {
            console.error('Error fetching roles:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        try {
            const token = Cookies.get('token')
            if (!token) return

            if (editingRole) {
                await axios.put(`${API_URL}/roles/${editingRole.id}`, formData, {
                    headers: { Authorization: `Bearer ${token}` }
                })
            } else {
                await axios.post(`${API_URL}/roles`, formData, {
                    headers: { Authorization: `Bearer ${token}` }
                })
            }

            fetchRoles()
            closeModal()
        } catch (error) {
            console.error('Error saving role:', error)
            alert('Failed to save role')
        }
    }

    const handleDelete = async (id: number) => {
        if (!confirm('Are you sure you want to delete this role?')) return

        try {
            const token = Cookies.get('token')
            if (!token) return

            await axios.delete(`${API_URL}/roles/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            })
            fetchRoles()
        } catch (error) {
            console.error('Error deleting role:', error)
            alert('Failed to delete role')
        }
    }

    const openModal = (role?: Role) => {
        if (role) {
            setEditingRole(role)
            setFormData({
                name: role.name,
                color: role.color,
                description: role.description || '',
                is_public: role.is_public
            })
        } else {
            setEditingRole(null)
            setFormData({
                name: '',
                color: '#3B82F6',
                description: '',
                is_public: false
            })
        }
        setShowModal(true)
    }

    const closeModal = () => {
        setShowModal(false)
        setEditingRole(null)
    }

    if (authLoading || (loading && roles.length === 0)) {
        return <Layout><div className="flex justify-center p-12">Loading...</div></Layout>
    }

    if (!user || user.role !== 'admin') {
        return <Layout><div className="p-12 text-center text-red-600">Access Denied</div></Layout>
    }

    return (
        <Layout>
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <h1 className="text-3xl font-bold text-gray-900">Manage Roles</h1>
                    <button
                        onClick={() => openModal()}
                        className="flex items-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors"
                    >
                        <FiPlus /> Create Role
                    </button>
                </div>

                <div className="bg-white rounded-lg shadow overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role Name</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Color</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Visibility</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {roles.map((role) => (
                                <tr key={role.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <span className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: role.color }}></span>
                                            <span className="text-sm font-medium text-gray-900">{role.name}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{role.color}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${role.is_public ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                            {role.is_public ? 'Public' : 'Private'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">{role.description}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <button onClick={() => openModal(role)} className="text-indigo-600 hover:text-indigo-900 mr-4">
                                            <FiEdit2 className="w-5 h-5" />
                                        </button>
                                        <button onClick={() => handleDelete(role.id)} className="text-red-600 hover:text-red-900">
                                            <FiTrash2 className="w-5 h-5" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {roles.length === 0 && (
                        <div className="p-12 text-center text-gray-500">No roles found. Create one!</div>
                    )}
                </div>
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 overflow-y-auto">
                    <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                        <div className="fixed inset-0 transition-opacity" aria-hidden="true">
                            <div className="absolute inset-0 bg-gray-500 opacity-75" onClick={closeModal}></div>
                        </div>

                        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                            <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="text-lg font-medium text-gray-900">{editingRole ? 'Edit Role' : 'Create New Role'}</h3>
                                    <button onClick={closeModal} className="text-gray-400 hover:text-gray-500"><FiX className="w-5 h-5" /></button>
                                </div>
                                <form onSubmit={handleSubmit} className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Role Name</label>
                                        <input
                                            type="text"
                                            required
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm border p-2"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Color</label>
                                        <div className="flex items-center mt-1">
                                            <input
                                                type="color"
                                                value={formData.color}
                                                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                                                className="h-10 w-20 p-1 rounded border border-gray-300 mr-3"
                                            />
                                            <input
                                                type="text"
                                                value={formData.color}
                                                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                                                className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm border p-2"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Description</label>
                                        <textarea
                                            value={formData.description}
                                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm border p-2"
                                            rows={3}
                                        />
                                    </div>
                                    <div className="flex items-center">
                                        <input
                                            id="is_public"
                                            type="checkbox"
                                            checked={formData.is_public}
                                            onChange={(e) => setFormData({ ...formData, is_public: e.target.checked })}
                                            className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                                        />
                                        <label htmlFor="is_public" className="ml-2 block text-sm text-gray-900">
                                            Public Role (Visible to everyone)
                                        </label>
                                    </div>
                                    <div className="mt-5 sm:mt-6 flex justify-end gap-3">
                                        <button
                                            type="button"
                                            onClick={closeModal}
                                            className="inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:text-sm"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            className="inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-primary-600 text-base font-medium text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:text-sm"
                                        >
                                            {editingRole ? 'Update Role' : 'Create Role'}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </Layout>
    )
}
