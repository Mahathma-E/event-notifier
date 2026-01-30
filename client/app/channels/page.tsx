'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import Layout from '@/components/Layout'
import axios from 'axios'
import Cookies from 'js-cookie'
import { FiSearch, FiPlus, FiHash, FiLock, FiX, FiArrowRight } from 'react-icons/fi'
import Link from 'next/link'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'

interface Role {
    id: number
    name: string
    color: string
    is_public: boolean
}

interface Channel {
    id: number
    name: string
    description: string
    is_private: boolean
    tags: Role[]
}

export default function ChannelsPage() {
    const { user, loading: authLoading } = useAuth()
    const [channels, setChannels] = useState<Channel[]>([])
    const [roles, setRoles] = useState<Role[]>([]) // For autocomplete
    const [loading, setLoading] = useState(true)

    // Search State
    const [searchText, setSearchText] = useState('')
    const [selectedTags, setSelectedTags] = useState<Role[]>([])

    // Create Modal State
    const [showCreateModal, setShowCreateModal] = useState(false)
    const [newChannelData, setNewChannelData] = useState({
        name: '',
        description: '',
        is_private: false,
        tags: [] as number[] // Role IDs
    })

    useEffect(() => {
        if (user) {
            fetchData()
        }
    }, [user])

    useEffect(() => {
        // Debounce search or just fetch when filters change
        const timeoutId = setTimeout(() => {
            fetchChannels()
        }, 300)
        return () => clearTimeout(timeoutId)
    }, [searchText, selectedTags])

    const fetchData = async () => {
        try {
            setLoading(true)
            const token = Cookies.get('token')
            if (token) axios.defaults.headers.common['Authorization'] = `Bearer ${token}`

            const [rolesRes] = await Promise.all([
                axios.get(`${API_URL}/roles`),
                // Initial channel fetch will be triggered by useEffect
            ])

            setRoles(rolesRes.data)
        } catch (error) {
            console.error('Error fetching initial data:', error)
        } finally {
            // loading state handled by fetchChannels
        }
    }

    const fetchChannels = async () => {
        try {
            setLoading(true)
            const token = Cookies.get('token')
            if (token) axios.defaults.headers.common['Authorization'] = `Bearer ${token}`

            const params = new URLSearchParams()
            if (searchText) params.append('search', searchText)
            if (selectedTags.length > 0) params.append('tags', selectedTags.map(t => t.id).join(','))

            const response = await axios.get(`${API_URL}/channels?${params.toString()}`)
            setChannels(response.data)
        } catch (error) {
            console.error('Error fetching channels:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleTagClick = (role: Role) => {
        if (!selectedTags.find(t => t.id === role.id)) {
            setSelectedTags([...selectedTags, role])
        }
    }

    const removeTag = (roleId: number) => {
        setSelectedTags(selectedTags.filter(t => t.id !== roleId))
    }

    const handleCreateSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        try {
            await axios.post(`${API_URL}/channels`, newChannelData)
            setShowCreateModal(false)
            setNewChannelData({ name: '', description: '', is_private: false, tags: [] })
            fetchChannels()
        } catch (error) {
            console.error('Error creating channel:', error)
            alert('Failed to create channel')
        }
    }

    const toggleNewChannelTag = (roleId: number) => {
        if (newChannelData.tags.includes(roleId)) {
            setNewChannelData({ ...newChannelData, tags: newChannelData.tags.filter(id => id !== roleId) })
        } else {
            setNewChannelData({ ...newChannelData, tags: [...newChannelData.tags, roleId] })
        }
    }

    if (authLoading) return <Layout><div>Loading...</div></Layout>

    return (
        <Layout>
            <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <h1 className="text-3xl font-bold text-gray-900">Discover Channels</h1>
                    {user?.role === 'admin' && (
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="flex items-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors"
                        >
                            <FiPlus /> Create Channel
                        </button>
                    )}
                </div>

                {/* Search Bar */}
                <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                    <div className="flex flex-wrap items-center gap-2 p-2 border border-gray-300 rounded-md focus-within:ring-2 focus-within:ring-primary-500 focus-within:border-transparent">
                        <FiSearch className="text-gray-400 w-5 h-5 ml-2" />

                        {selectedTags.map(tag => (
                            <span
                                key={tag.id}
                                className="flex items-center gap-1 px-2 py-1 rounded text-xs font-medium text-white"
                                style={{ backgroundColor: tag.color || '#3B82F6' }}
                            >
                                {tag.name}
                                <button onClick={() => removeTag(tag.id)} className="hover:text-gray-200"><FiX /></button>
                            </span>
                        ))}

                        <input
                            type="text"
                            value={searchText}
                            onChange={(e) => setSearchText(e.target.value)}
                            placeholder={selectedTags.length === 0 ? "Search channels by name..." : ""}
                            className="flex-1 outline-none min-w-[150px] text-sm"
                        />
                    </div>

                    {/* Suggested Tags (Public Roles) */}
                    <div className="mt-3 flex flex-wrap gap-2">
                        <span className="text-xs text-gray-500 py-1">Try tags:</span>
                        {roles.filter(r => r.is_public && !selectedTags.find(t => t.id === r.id)).slice(0, 5).map(role => (
                            <button
                                key={role.id}
                                onClick={() => handleTagClick(role)}
                                className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
                            >
                                #{role.name}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Channels Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {channels.map(channel => (
                        <Link href={`/channels/${channel.id}`} key={channel.id}>
                            <div className="bg-white rounded-lg shadow hover:shadow-md transition-shadow p-6 border border-gray-100 h-full flex flex-col cursor-pointer">
                                <div className="flex justify-between items-start mb-2">
                                    <div className="flex items-center gap-2">
                                        <div className="p-2 bg-gray-100 rounded-md text-gray-600">
                                            {channel.is_private ? <FiLock /> : <FiHash />}
                                        </div>
                                        <h3 className="text-lg font-bold text-gray-900 group-hover:text-primary-600">{channel.name}</h3>
                                    </div>
                                    {channel.is_private && (
                                        <span className="px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">Private</span>
                                    )}
                                </div>

                                <p className="text-gray-600 text-sm mb-4 line-clamp-2 min-h-[40px]">
                                    {channel.description || 'No description provided.'}
                                </p>

                                <div className="flex flex-wrap gap-2 mt-auto mb-3">
                                    {channel.tags && channel.tags.map(tag => (
                                        <span
                                            key={tag.id}
                                            className="text-xs px-2 py-1 rounded font-medium text-white cursor-pointer opacity-90 hover:opacity-100"
                                            style={{ backgroundColor: tag.color || '#3B82F6' }}
                                            onClick={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                handleTagClick(tag);
                                            }}
                                        >
                                            {tag.name}
                                        </span>
                                    ))}
                                </div>

                                <div className="pt-3 border-t border-gray-50 flex justify-end">
                                    <span className="text-primary-600 text-sm font-medium flex items-center gap-1">
                                        View Channel <FiArrowRight />
                                    </span>
                                </div>
                            </div>
                        </Link>
                    ))}
                    {!loading && channels.length === 0 && (
                        <div className="col-span-full text-center py-12 text-gray-500">
                            No channels found matching your criteria.
                        </div>
                    )}
                </div>
            </div>

            {/* Create Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 z-50 overflow-y-auto">
                    <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setShowCreateModal(false)}></div>

                        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                            <form onSubmit={handleCreateSubmit} className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                                <div className="mb-4 flex justify-between items-center">
                                    <h3 className="text-lg font-medium text-gray-900">Create New Channel</h3>
                                    <button type="button" onClick={() => setShowCreateModal(false)} className="text-gray-400 hover:text-gray-500"><FiX /></button>
                                </div>

                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Channel Name</label>
                                        <div className="mt-1 flex rounded-md shadow-sm">
                                            <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">#</span>
                                            <input
                                                type="text"
                                                required
                                                value={newChannelData.name}
                                                onChange={(e) => setNewChannelData({ ...newChannelData, name: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
                                                className="flex-1 min-w-0 block w-full px-3 py-2 rounded-none rounded-r-md border border-gray-300 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                                                placeholder="channel-name"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Description</label>
                                        <textarea
                                            value={newChannelData.description}
                                            onChange={(e) => setNewChannelData({ ...newChannelData, description: e.target.value })}
                                            rows={3}
                                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                                        />
                                    </div>

                                    <div className="flex items-center">
                                        <input
                                            id="is_private"
                                            type="checkbox"
                                            checked={newChannelData.is_private}
                                            onChange={(e) => setNewChannelData({ ...newChannelData, is_private: e.target.checked })}
                                            className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                                        />
                                        <label htmlFor="is_private" className="ml-2 block text-sm text-gray-900">
                                            Private Channel (Requires Roles)
                                        </label>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Required Roles / Tags</label>
                                        <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto p-2 border border-gray-200 rounded-md">
                                            {roles.map(role => (
                                                <button
                                                    key={role.id}
                                                    type="button"
                                                    onClick={() => toggleNewChannelTag(role.id)}
                                                    className={`px-2 py-1 rounded text-xs font-medium border transition-colors ${newChannelData.tags.includes(role.id)
                                                        ? 'bg-primary-50 border-primary-500 text-primary-700'
                                                        : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                                                        }`}
                                                >
                                                    {role.name}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-5 sm:mt-6 flex justify-end gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setShowCreateModal(false)}
                                        className="inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:text-sm"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-primary-600 text-base font-medium text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:text-sm"
                                    >
                                        Create Channel
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </Layout>
    )
}
