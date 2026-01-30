'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import Layout from '@/components/Layout'
import axios from 'axios'
import Cookies from 'js-cookie'
import { FiArrowLeft, FiHash, FiLock, FiUserCheck, FiSend, FiUsers, FiTrash2, FiShield } from 'react-icons/fi'
import { format } from 'date-fns'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'

interface Channel {
    id: number
    name: string
    description: string
    is_private: boolean
}

interface Post {
    id: number
    title: string
    content: string
    author_name: string
    created_by: number
    created_at: string
}

interface User {
    id: number
    name: string
    email: string
    role: string
    joined_at?: string
}

export default function ChannelDetailsPage() {
    const { id } = useParams()
    const router = useRouter()
    const { user, loading: authLoading } = useAuth()

    const [channel, setChannel] = useState<Channel | null>(null)
    const [posts, setPosts] = useState<Post[]>([])
    const [isMember, setIsMember] = useState(false)
    const [currentUserIsAdmin, setCurrentUserIsAdmin] = useState(false)
    const [loading, setLoading] = useState(true)
    const [joining, setJoining] = useState(false)

    // Post form
    const [showPostForm, setShowPostForm] = useState(false)
    const [newPost, setNewPost] = useState({ title: '', content: '' })

    // Admin Managment
    const [channelAdmins, setChannelAdmins] = useState<User[]>([])
    const [channelMembers, setChannelMembers] = useState<User[]>([])
    const [facultyUsers, setFacultyUsers] = useState<User[]>([])
    const [showAdminModal, setShowAdminModal] = useState(false)
    const [showMembersModal, setShowMembersModal] = useState(false)

    useEffect(() => {
        if (user && id) {
            fetchChannelData()
        }
    }, [user, id])

    const fetchChannelData = async () => {
        try {
            setLoading(true)
            const token = Cookies.get('token')
            if (token) axios.defaults.headers.common['Authorization'] = `Bearer ${token}`

            // Fetch Channel Info
            // We don't have a direct get-by-id endpoint publicly exposed well in the list API, 
            // but let's assume valid access for now or implement a specific GET /channels/:id 
            // Actually my backend only has GET /channels (list). 
            // To get specific channel details, I might need to filter client side or update backend.
            // Let's filter client side from the list for now or add endpoint. 
            // Wait, I didn't add GET /channels/:id. I should add it or use the list with id filter if supported?
            // I'll grab all and find. Not efficient but works for MVP. 
            // Better: Add GET /channels/:id to backend? Too late to switch task cleanly. 
            // Let's try to fetch list and find.

            const channelsRes = await axios.get(`${API_URL}/channels`)
            const found = channelsRes.data.find((c: any) => c.id === parseInt(id as string))

            if (found) {
                setChannel(found)

                // Check Membership
                try {
                    const memberRes = await axios.get(`${API_URL}/channels/${id}/membership`)
                    // Update state
                    setIsMember(memberRes.data.isMember)
                    setCurrentUserIsAdmin(memberRes.data.isAdmin)

                    // If member or channel admin, fetch posts
                    if (memberRes.data.isMember || user?.role === 'admin' || memberRes.data.isAdmin) {
                        const postsRes = await axios.get(`${API_URL}/channels/${id}/posts`)
                        setPosts(postsRes.data)
                    }

                    // If Super Admin, fetch Channel Admins
                    if (user?.role === 'admin') {
                        const adminsRes = await axios.get(`${API_URL}/channels/${id}/admins`)
                        setChannelAdmins(adminsRes.data)
                        // Also fetch all users to filter faculty for assignment
                        const usersRes = await axios.get(`${API_URL}/users`)
                        setFacultyUsers(usersRes.data.users)
                    }

                    // If Admin or Channel Admin, fetch members
                    const isAdmin = user?.role === 'admin'
                    const isChanAdmin = memberRes.data.isAdmin

                    if (isAdmin || isChanAdmin) {
                        const membersRes = await axios.get(`${API_URL}/channels/${id}/members`)
                        setChannelMembers(membersRes.data)
                    }
                } catch (e) {
                    console.error("Access restricted or error checking membership")
                }
            }
        } catch (error) {
            console.error('Error fetching channel data:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleJoin = async () => {
        try {
            setJoining(true)
            const token = Cookies.get('token')
            if (!token) return

            await axios.post(`${API_URL}/channels/${id}/join`)
            setIsMember(true)
            fetchChannelData() // Refresh posts
        } catch (error) {
            console.error('Error joining channel:', error)
            alert('Failed to join channel')
        } finally {
            setJoining(false)
        }
    }

    const handleLeave = async () => {
        if (!confirm('Are you sure you want to leave this channel?')) return
        try {
            setJoining(true)
            const token = Cookies.get('token')
            if (!token) return

            await axios.post(`${API_URL}/channels/${id}/leave`)
            setIsMember(false)
            setPosts([])
        } catch (error) {
            console.error('Error leaving channel:', error)
        } finally {
            setJoining(false)
        }
    }

    const handlePostSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        try {
            await axios.post(`${API_URL}/channels/${id}/posts`, newPost)
            setNewPost({ title: '', content: '' })
            setShowPostForm(false)
            fetchChannelData()
        } catch (error) {
            console.error("Error creating post:", error)
            alert("Failed to create post. Only admins can post.")
        }
    }

    const handleAddAdmin = async (userId: number) => {
        try {
            await axios.post(`${API_URL}/channels/${id}/admins`, { userId })
            // Refresh admins
            const adminsRes = await axios.get(`${API_URL}/channels/${id}/admins`)
            setChannelAdmins(adminsRes.data)
            setShowAdminModal(false)
        } catch (error) {
            console.error("Error adding admin:", error)
            alert("Failed to add admin")
        }
    }

    const handleRemoveAdmin = async (userId: number) => {
        if (!confirm('Remove this user from channel admins?')) return
        try {
            await axios.delete(`${API_URL}/channels/${id}/admins/${userId}`)
            // Refresh admins
            const adminsRes = await axios.get(`${API_URL}/channels/${id}/admins`)
            setChannelAdmins(adminsRes.data)
        } catch (error) {
            console.error("Error removing admin:", error)
        }
    }

    const handleKickMember = async (userId: number) => {
        if (!confirm('Kick this member from the channel?')) return
        try {
            await axios.delete(`${API_URL}/channels/${id}/members/${userId}`)
            // Refresh members
            const membersRes = await axios.get(`${API_URL}/channels/${id}/members`)
            setChannelMembers(membersRes.data)
        } catch (error) {
            console.error("Error kicking member:", error)
            alert("Failed to kick member")
        }
    }

    const handleDeletePost = async (postId: number) => {
        if (!confirm('Delete this post?')) return
        try {
            await axios.delete(`${API_URL}/channels/${id}/posts/${postId}`)
            fetchChannelData()
        } catch (error) {
            console.error("Error deleting post:", error)
            alert("Failed to delete post")
        }
    }


    if (authLoading || loading) return <Layout><div>Loading...</div></Layout>
    if (!channel) return <Layout><div>Channel not found</div></Layout>

    return (
        <Layout>
            <div className="max-w-4xl mx-auto space-y-6">
                <button onClick={() => router.push('/channels')} className="flex items-center text-gray-600 hover:text-gray-900 mb-4">
                    <FiArrowLeft className="mr-2" /> Back to Channels
                </button>

                {/* Channel Header */}
                <div className="bg-white rounded-lg shadow p-6 flex items-center justify-between">
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-2xl font-bold flex items-center gap-2">
                                {channel.is_private ? <FiLock className="text-gray-400" /> : <FiHash className="text-gray-400" />}
                                {channel.name}
                            </h1>
                            {channel.is_private && <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded">Private</span>}
                        </div>
                        <p className="text-gray-600 mt-2">{channel.description}</p>
                    </div>
                    <div>
                        {isMember ? (
                            <button
                                onClick={handleLeave}
                                disabled={joining}
                                className="border border-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-50 flex items-center gap-2"
                            >
                                <FiUserCheck /> Joined
                            </button>
                        ) : (
                            <button
                                onClick={handleJoin}
                                disabled={joining}
                                className="bg-primary-600 text-white px-6 py-2 rounded hover:bg-primary-700 disabled:opacity-50"
                            >
                                {joining ? 'Joining...' : 'Join Channel'}
                            </button>
                        )}

                        {(user?.role === 'admin' || currentUserIsAdmin) && (
                            <button
                                onClick={() => setShowMembersModal(true)}
                                className="ml-2 border border-blue-300 text-blue-700 px-3 py-2 rounded hover:bg-blue-50 flex items-center gap-2"
                                title="Manage Members"
                            >
                                <FiUsers />
                            </button>
                        )}
                    </div>
                </div>

                {/* Admin Management Section (Super Admin Only) */}
                {/* Admin Management Section (Super Admin Only) */}
                {user?.role === 'admin' && (
                    <div className="bg-white rounded-lg shadow p-6 border-l-4 border-indigo-500">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-lg font-bold text-indigo-900">Channel Administration</h2>
                            <button
                                onClick={() => setShowAdminModal(true)}
                                className="text-sm bg-indigo-100 text-indigo-700 px-3 py-1 rounded hover:bg-indigo-200"
                            >
                                + Assign Channel Admin
                            </button>
                        </div>

                        {channelAdmins.length > 0 ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {channelAdmins.map(admin => (
                                    <div key={admin.id} className="flex justify-between items-center p-3 bg-gray-50 rounded border border-gray-200">
                                        <div>
                                            <p className="font-medium text-sm">{admin.name}</p>
                                            {/* <p className="text-xs text-gray-500">{admin.email}</p> */}
                                        </div>
                                        <button
                                            onClick={() => handleRemoveAdmin(admin.id)}
                                            className="text-red-500 hover:text-red-700 text-xs font-medium"
                                        >
                                            Remove
                                        </button>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm text-gray-500 italic">No faculty admins assigned yet. Only you can manage this channel.</p>
                        )}
                    </div>
                )}

                {/* Posts Section */}
                {isMember || user?.role === 'admin' || currentUserIsAdmin ? (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-semibold">Channel Updates</h2>
                            {(user?.role === 'admin' || user?.role === 'faculty' || currentUserIsAdmin) && (
                                <button
                                    onClick={() => setShowPostForm(!showPostForm)}
                                    className="text-primary-600 hover:text-primary-800 font-medium"
                                >
                                    + New Post
                                </button>
                            )}
                        </div>

                        {showPostForm && (
                            <div className="bg-white p-4 rounded-lg shadow border border-primary-100 animate-fade-in">
                                <form onSubmit={handlePostSubmit} className="space-y-4">
                                    <input
                                        type="text"
                                        placeholder="Post Title"
                                        required
                                        value={newPost.title}
                                        onChange={e => setNewPost({ ...newPost, title: e.target.value })}
                                        className="w-full border rounded p-2 focus:ring-2 focus:ring-primary-500"
                                    />
                                    <textarea
                                        placeholder="What's happening?"
                                        required
                                        value={newPost.content}
                                        onChange={e => setNewPost({ ...newPost, content: e.target.value })}
                                        className="w-full border rounded p-2 focus:ring-2 focus:ring-primary-500"
                                        rows={3}
                                    />
                                    <div className="flex justify-end gap-2">
                                        <button type="button" onClick={() => setShowPostForm(false)} className="text-gray-500 px-3 py-1">Cancel</button>
                                        <button type="submit" className="bg-primary-600 text-white px-4 py-1 rounded flex items-center gap-2">
                                            <FiSend /> Post
                                        </button>
                                    </div>
                                </form>
                            </div>
                        )}

                        <div className="space-y-4">
                            {posts.length > 0 ? (
                                posts.map(post => (
                                    <div key={post.id} className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 relative group">
                                        <h3 className="font-bold text-lg text-gray-900">{post.title}</h3>
                                        <div className="text-xs text-gray-500 mb-3 flex gap-2">
                                            <span>{post.author_name}</span> &bull; <span>{format(new Date(post.created_at), 'PPP p')}</span>
                                        </div>
                                        <p className="text-gray-700 whitespace-pre-wrap">{post.content}</p>

                                        {(user?.role === 'admin' || user?.id === post.created_by) && (
                                            <button
                                                onClick={() => handleDeletePost(post.id)}
                                                className="absolute top-4 right-4 text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                                                title="Delete Post"
                                            >
                                                <FiTrash2 />
                                            </button>
                                        )}
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-12 text-gray-500 bg-white rounded-lg border border-dashed border-gray-300">
                                    No posts yet.
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="text-center py-12 bg-white rounded-lg shadow">
                        <p className="text-gray-500">Join this channel to view posts and updates.</p>
                    </div>
                )}
            </div>
            {/* Admin Assign Modal */}
            {
                showAdminModal && (
                    <div className="fixed inset-0 z-50 overflow-y-auto">
                        <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setShowAdminModal(false)}></div>
                            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                                    <h3 className="text-lg font-medium text-gray-900 mb-4">Assign Channel Admin</h3>
                                    <div className="max-h-60 overflow-y-auto space-y-2">
                                        {facultyUsers.filter(u => !channelAdmins.find(ca => ca.id === u.id)).map(faculty => (
                                            <div key={faculty.id} className="flex justify-between items-center p-2 hover:bg-gray-50 rounded border border-gray-100">
                                                <div>
                                                    <p className="font-medium text-sm">{faculty.name}</p>
                                                    {/* <p className="text-xs text-gray-500">{faculty.email}</p> */}
                                                </div>
                                                <button
                                                    onClick={() => handleAddAdmin(faculty.id)}
                                                    className="text-sm bg-primary-50 text-primary-700 px-3 py-1 rounded hover:bg-primary-100"
                                                >
                                                    Assign
                                                </button>
                                            </div>
                                        ))}
                                        {facultyUsers.filter(u => !channelAdmins.find(ca => ca.id === u.id)).length === 0 && (
                                            <p className="text-gray-500 text-sm text-center py-4">No available faculty to assign.</p>
                                        )}
                                    </div>
                                </div>
                                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                                    <button type="button" onClick={() => setShowAdminModal(false)} className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm">
                                        Close
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Members Management Modal */}
            {
                showMembersModal && (
                    <div className="fixed inset-0 z-50 overflow-y-auto">
                        <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setShowMembersModal(false)}></div>
                            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-3xl sm:w-full">
                                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                                    <div className="flex justify-between items-center mb-4">
                                        <h3 className="text-lg font-medium text-gray-900">Channel Members ({channelMembers.length})</h3>
                                        <button onClick={() => setShowMembersModal(false)} className="text-gray-400 hover:text-gray-600">
                                            <span className="sr-only">Close</span>
                                            <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </button>
                                    </div>
                                    <div className="max-h-96 overflow-y-auto">
                                        <table className="min-w-full divide-y divide-gray-200">
                                            <thead className="bg-gray-50">
                                                <tr>
                                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Joined At</th>
                                                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody className="bg-white divide-y divide-gray-200">
                                                {channelMembers.map((member) => (
                                                    <tr key={member.id}>
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <div className="flex items-center">
                                                                <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center text-sm font-medium mr-3">
                                                                    {member.name.charAt(0)}
                                                                </div>
                                                                <div>
                                                                    <div className="text-sm font-medium text-gray-900">{member.name}</div>
                                                                    {/* <div className="text-sm text-gray-500">{member.email}</div> */}
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800 capitalize">
                                                                {member.role}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                            {member.joined_at ? format(new Date(member.joined_at), 'PP') : '-'}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                            <button
                                                                onClick={() => handleKickMember(member.id)}
                                                                className="text-red-600 hover:text-red-900"
                                                            >
                                                                Kick
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                                {channelMembers.length === 0 && (
                                                    <tr>
                                                        <td colSpan={4} className="px-6 py-4 text-center text-sm text-gray-500">
                                                            No members yet.
                                                        </td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )
            }
        </Layout >
    )
}
