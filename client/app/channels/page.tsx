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

    if (authLoading) return <Layout><div className="text-white p-6">Loading...</div></Layout>

    return (
        <Layout>
            <div className="space-y-6 max-w-[900px] mx-auto p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <h1 className="text-2xl font-bold text-white">Discover Channels</h1>
                    {user?.role === 'admin' && (
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="flex items-center gap-2 bg-primary-500 text-white px-4 py-2 rounded-full font-bold hover:bg-primary-600 transition-colors shadow-sm"
                        >
                            <FiPlus className="w-5 h-5" /> Create Channel
                        </button>
                    )}
                </div>

                {/* Search Bar */}
                <div className="bg-[#16181c] p-1 rounded-full shadow-sm border border-dark-border focus-within:border-primary-500 focus-within:ring-1 focus-within:ring-primary-500 transition-colors">
                    <div className="flex flex-wrap items-center gap-2 px-3">
                        <FiSearch className="text-[#71767b] w-5 h-5" />

                        {selectedTags.map(tag => (
                            <span
                                key={tag.id}
                                className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold text-white"
                                style={{ backgroundColor: tag.color || '#3B82F6' }}
                            >
                                {tag.name}
                                <button onClick={() => removeTag(tag.id)} className="hover:text-gray-200 ml-1"><FiX /></button>
                            </span>
                        ))}

                        <input
                            type="text"
                            value={searchText}
                            onChange={(e) => setSearchText(e.target.value)}
                            placeholder={selectedTags.length === 0 ? "Search channels..." : ""}
                            className="flex-1 bg-transparent text-white outline-none min-w-[150px] text-sm py-2 placeholder-[#71767b]"
                        />
                    </div>
                </div>

                {/* Suggested Tags (Public Roles) */}
                <div className="flex flex-wrap gap-2 items-center">
                    <span className="text-xs text-[#71767b]">Try tags:</span>
                    {roles.filter(r => r.is_public && !selectedTags.find(t => t.id === r.id)).slice(0, 5).map(role => (
                        <button
                            key={role.id}
                            onClick={() => handleTagClick(role)}
                            className="text-xs px-3 py-1 rounded-full bg-[#16181c] border border-dark-border text-primary-500 hover:bg-[#202327] transition-colors font-medium border-primary-500/20"
                        >
                            #{role.name}
                        </button>
                    ))}
                </div>


                {/* Channels Grid */}
                <div className="grid grid-cols-1 gap-4">
                    {channels.map(channel => (
                        <Link href={`/channels/${channel.id}`} key={channel.id}>
                            <div className="bg-transparent hover:bg-[#16181c] transition-colors p-4 border-b border-dark-border cursor-pointer flex justify-between group">
                                <div className="flex gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-[#202327] flex items-center justify-center text-[#71767b] group-hover:text-white transition-colors">
                                        {channel.is_private ? <FiLock className="w-6 h-6" /> : <FiHash className="w-6 h-6" />}
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h3 className="text-base font-bold text-white group-hover:underline">{channel.name}</h3>
                                            {channel.is_private && (
                                                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#202327] text-[#71767b] border border-dark-border">PRIVATE</span>
                                            )}
                                        </div>
                                        <p className="text-[#71767b] text-sm mt-1 line-clamp-1">
                                            {channel.description || 'No description provided.'}
                                        </p>
                                        <div className="flex flex-wrap gap-2 mt-2">
                                            {channel.tags && channel.tags.map(tag => (
                                                <span
                                                    key={tag.id}
                                                    className="text-[10px] px-1.5 py-0.5 rounded font-bold text-white/80"
                                                    style={{ backgroundColor: tag.color || '#3B82F6' }}
                                                >
                                                    {tag.name}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center">
                                    <FiArrowRight className="text-[#71767b] group-hover:text-primary-500 transition-colors" />
                                </div>
                            </div>
                        </Link>
                    ))}
                    {!loading && channels.length === 0 && (
                        <div className="col-span-full text-center py-20 text-[#71767b]">
                            No channels found matching your criteria.
                        </div>
                    )}
                </div>
            </div>

            {/* Create Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 z-50 overflow-y-auto">
                    <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                        <div className="fixed inset-0 bg-white/5 backdrop-blur-sm transition-opacity" onClick={() => setShowCreateModal(false)}></div>

                        <div className="inline-block align-bottom bg-black border border-dark-border rounded-2xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                            <form onSubmit={handleCreateSubmit} className=" px-6 pt-6 pb-6">
                                <div className="mb-6 flex justify-between items-center">
                                    <h3 className="text-xl font-bold text-white">Create New Channel</h3>
                                    <button type="button" onClick={() => setShowCreateModal(false)} className="text-[#71767b] hover:text-white rounded-full p-1 hover:bg-[#202327] transition-colors"><FiX className="w-6 h-6" /></button>
                                </div>

                                <div className="space-y-6">
                                    <div>
                                        <label className="block text-sm font-bold text-[#71767b] mb-2">Channel Name</label>
                                        <div className="flex rounded-md shadow-sm">
                                            <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-dark-border bg-[#16181c] text-[#71767b] text-sm">#</span>
                                            <input
                                                type="text"
                                                required
                                                value={newChannelData.name}
                                                onChange={(e) => setNewChannelData({ ...newChannelData, name: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
                                                className="flex-1 min-w-0 block w-full px-3 py-2 rounded-none rounded-r-md bg-black border border-dark-border text-white focus:ring-1 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                                                placeholder="channel-name"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-bold text-[#71767b] mb-2">Description</label>
                                        <textarea
                                            value={newChannelData.description}
                                            onChange={(e) => setNewChannelData({ ...newChannelData, description: e.target.value })}
                                            rows={3}
                                            className="block w-full bg-black border border-dark-border rounded-md shadow-sm py-2 px-3 text-white focus:ring-1 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                                        />
                                    </div>

                                    <div className="flex items-center bg-[#16181c] p-3 rounded-lg border border-dark-border">
                                        <input
                                            id="is_private"
                                            type="checkbox"
                                            checked={newChannelData.is_private}
                                            onChange={(e) => setNewChannelData({ ...newChannelData, is_private: e.target.checked })}
                                            className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-600 rounded bg-black"
                                        />
                                        <label htmlFor="is_private" className="ml-3 block text-sm font-medium text-white">
                                            Private Channel (Requires Roles)
                                        </label>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-bold text-[#71767b] mb-2">Required Roles / Tags</label>
                                        <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto p-2 border border-dark-border rounded-md bg-[#16181c]">
                                            {roles.map(role => (
                                                <button
                                                    key={role.id}
                                                    type="button"
                                                    onClick={() => toggleNewChannelTag(role.id)}
                                                    className={`px-3 py-1 rounded-full text-xs font-bold border transition-colors ${newChannelData.tags.includes(role.id)
                                                        ? 'bg-primary-500/20 border-primary-500 text-primary-500'
                                                        : 'bg-black border-dark-border text-[#71767b] hover:bg-[#202327]'
                                                        }`}
                                                >
                                                    {role.name}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-8 flex justify-end gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setShowCreateModal(false)}
                                        className="inline-flex justify-center rounded-full border border-dark-border shadow-sm px-4 py-2 bg-transparent text-sm font-bold text-white hover:bg-[#202327] transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="inline-flex justify-center rounded-full border border-transparent shadow-sm px-6 py-2 bg-white text-sm font-bold text-black hover:bg-gray-200 transition-colors"
                                    >
                                        Create
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
