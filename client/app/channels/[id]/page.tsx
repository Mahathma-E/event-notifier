'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import Layout from '@/components/Layout'
import axios from 'axios'
import Cookies from 'js-cookie'
import { FiArrowLeft, FiHash, FiLock, FiUserCheck, FiSend, FiUsers, FiTrash2, FiShield, FiMoreVertical, FiSearch, FiUserPlus } from 'react-icons/fi'
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
    const [allUsers, setAllUsers] = useState<User[]>([])
    const [showAdminModal, setShowAdminModal] = useState(false)
    const [showMembersModal, setShowMembersModal] = useState(false)
    const [showAddMemberModal, setShowAddMemberModal] = useState(false)

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
                        setAllUsers(usersRes.data.users)
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

    const handleDeleteChannel = async () => {
        if (!confirm('Are you sure you want to delete this channel? This action cannot be undone.')) return
        try {
            const token = Cookies.get('token')
            if (token) axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
            await axios.delete(`${API_URL}/channels/${id}`)
            router.push('/channels')
        } catch (error) {
            console.error('Error deleting channel:', error)
            alert('Failed to delete channel')
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

    const handleAddMember = async (userId: number) => {
        try {
            await axios.post(`${API_URL}/channels/${id}/members`, { userId })
            // Refresh members
            const membersRes = await axios.get(`${API_URL}/channels/${id}/members`)
            setChannelMembers(membersRes.data)
            setShowAddMemberModal(false)
            alert('Member added successfully')
        } catch (error) {
            console.error("Error adding member:", error)
            alert("Failed to add member")
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


    if (authLoading || loading) return <Layout><div className="text-white p-4">Loading...</div></Layout>
    if (!channel) return <Layout><div className="text-white p-4">Channel not found</div></Layout>

    return (
        <Layout>
            <div className="max-w-[700px] mx-auto min-h-screen border-x border-dark-border">
                {/* Header with Blur */}
                <div className="bg-black/80 backdrop-blur-md sticky top-0 z-10 border-b border-dark-border px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <button onClick={() => router.push('/channels')} className="text-white hover:bg-dark-hover p-2 rounded-full transition-colors group">
                                <FiArrowLeft className="w-5 h-5 group-hover:text-primary-500 transition-colors" />
                            </button>
                            <div>
                                <h1 className="text-xl font-bold text-white flex items-center gap-2">
                                    {channel.is_private ? <FiLock className="text-lg text-gray-400" /> : <FiHash className="text-lg text-gray-400" />}
                                    {channel.name}
                                </h1>
                                <p className="text-sm text-[#71767b] flex items-center gap-2 mt-0.5">
                                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />
                                    {channelMembers.length} Members
                                </p>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-2">
                            {user?.role === 'admin' && (
                                <button
                                    onClick={handleDeleteChannel}
                                    className="p-2 text-red-500 hover:bg-red-500/10 rounded-full"
                                    title="Delete Channel"
                                >
                                    <FiTrash2 className="w-5 h-5" />
                                </button>
                            )}
                            {(user?.role === 'admin' || currentUserIsAdmin) && (
                                <button
                                    onClick={() => setShowMembersModal(true)}
                                    className="p-2 text-primary-500 hover:bg-primary-500/10 rounded-full"
                                    title="Members"
                                >
                                    <FiUsers className="w-5 h-5" />
                                </button>
                            )}
                            {user?.role === 'admin' && (
                                <button
                                    onClick={() => setShowAdminModal(true)}
                                    className="p-2 text-white hover:bg-dark-hover rounded-full"
                                    title="Settings"
                                >
                                    <FiShield className="w-5 h-5" />
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Main Feed */}
                <div className="p-4 space-y-4">
                    {/* Join/Leave Area */}
                    <div className="bg-[#16181c] p-4 rounded-xl border border-dark-border mb-6">
                        <h3 className="text-lg font-bold text-white mb-1">Welcome to #{channel.name}</h3>
                        <p className="text-[#71767b] mb-4">{channel.description}</p>

                        {isMember ? (
                            <button
                                onClick={handleLeave}
                                disabled={joining}
                                className="border border-dark-border text-white px-4 py-2 rounded-full hover:bg-red-500/10 hover:border-red-500 hover:text-red-500 transition-colors text-sm font-bold"
                            >
                                {joining ? 'Leaving...' : 'Leave Channel'}
                            </button>
                        ) : (
                            <button
                                onClick={handleJoin}
                                disabled={joining}
                                className="bg-white text-black px-6 py-2 rounded-full hover:bg-gray-200 transition-colors text-sm font-bold"
                            >
                                {joining ? 'Joining...' : 'Join Channel'}
                            </button>
                        )}
                    </div>

                    {/* Posts */}
                    {isMember || user?.role === 'admin' || currentUserIsAdmin ? (
                        <>
                            {(user?.role === 'admin' || user?.role === 'faculty' || currentUserIsAdmin) && (
                                <div className="border-b border-dark-border pb-4 mb-4" onClick={() => setShowPostForm(true)}>
                                    {!showPostForm ? (
                                        <div className="flex items-center gap-3 cursor-pointer">
                                            <div className="w-10 h-10 rounded-full bg-gray-500 flex-shrink-0"></div>
                                            <div className="flex-1 bg-[#202327] text-[#71767b] p-3 rounded-full hover:bg-[#1d1f23] transition-colors">
                                                Type a new post...
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="bg-black border border-dark-border rounded-xl p-4 animate-fade-in">
                                            <form onSubmit={handlePostSubmit} className="space-y-3">
                                                <input
                                                    type="text"
                                                    placeholder="Title"
                                                    required
                                                    value={newPost.title}
                                                    onChange={e => setNewPost({ ...newPost, title: e.target.value })}
                                                    className="w-full bg-transparent border-b border-dark-border p-2 text-white focus:outline-none focus:border-primary-500"
                                                />
                                                <textarea
                                                    placeholder="What is happening?"
                                                    required
                                                    value={newPost.content}
                                                    onChange={e => setNewPost({ ...newPost, content: e.target.value })}
                                                    className="w-full bg-transparent p-2 text-white resize-none focus:outline-none h-24"
                                                />
                                                <div className="flex justify-end gap-3 pt-2">
                                                    <button type="button" onClick={() => setShowPostForm(false)} className="text-[#71767b] hover:text-white transition-colors">Cancel</button>
                                                    <button type="submit" className="bg-primary-500 text-white px-4 py-1.5 rounded-full font-bold hover:bg-primary-600 transition-colors disabled:opacity-50">
                                                        Post
                                                    </button>
                                                </div>
                                            </form>
                                        </div>
                                    )}
                                </div>
                            )}

                            <div className="space-y-4 pb-20">
                                {posts.map(post => (
                                    <div key={post.id} className="border-b border-dark-border hover:bg-[#16181c]/50 transition-colors px-6 py-4 cursor-pointer group">
                                        <div className="flex gap-4">
                                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-700 to-gray-900 flex-shrink-0 flex items-center justify-center text-white font-bold border border-dark-border shadow-sm">
                                                {post.author_name.charAt(0).toUpperCase()}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between mb-1">
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-bold text-white hover:underline cursor-pointer text-[15px]">{post.author_name}</span>
                                                        <span className="text-[#71767b] text-sm">&bull; {format(new Date(post.created_at), 'MMM d')}</span>
                                                    </div>
                                                    {(user?.role === 'admin' || user?.id === post.created_by) && (
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); handleDeletePost(post.id); }}
                                                            className="text-[#71767b] hover:text-red-500 transition-colors p-1.5 rounded-full hover:bg-red-500/10 opacity-0 group-hover:opacity-100"
                                                        >
                                                            <FiTrash2 className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                </div>
                                                <h3 className="font-bold text-white text-[15px] leading-snug">{post.title}</h3>
                                                <p className="text-[#dbebec] mt-1 whitespace-pre-wrap leading-normal font-light">{post.content}</p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {posts.length === 0 && (
                                    <div className="text-center py-12 text-[#71767b]">
                                        <p>No posts yet. Be the first to post!</p>
                                    </div>
                                )}
                            </div>
                        </>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-20 text-center">
                            <FiLock className="w-12 h-12 text-gray-600 mb-4" />
                            <h3 className="text-2xl font-bold text-white">Private Channel</h3>
                            <p className="text-[#71767b] mt-2">Join this channel to view posts and interact with members.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Members Management Modal (Restyled as Full Dark Overlay) */}
            {showMembersModal && (
                <div className="fixed inset-0 z-50 overflow-hidden bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-[#1e1f22] w-full max-w-5xl h-[85vh] rounded-xl shadow-2xl overflow-hidden flex flex-col font-sans">
                        {/* Modal Header */}
                        <div className="p-6 border-b border-[#2b2d31] flex justify-between items-center bg-[#2b2d31]">
                            <div className="flex items-center gap-2">
                                <FiUsers className="text-[#949BA4]" />
                                <h3 className="text-white font-bold text-lg">Members</h3>
                            </div>
                            <button onClick={() => setShowMembersModal(false)} className="text-[#949BA4] hover:text-white transition-colors">
                                <span className="sr-only">Close</span>
                                <FiXCircle />
                            </button>
                        </div>

                        {/* Search & Filter Bar */}
                        <div className="p-4 bg-[#2b2d31] flex justify-between items-center border-b border-[#1e1f22]">
                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder="Search members"
                                    className="bg-[#1e1f22] text-white pl-10 pr-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 w-64 text-sm"
                                />
                                <FiSearch className="absolute left-3 top-2.5 text-[#949BA4]" />
                            </div>
                            <div className="flex items-center gap-4">
                                {user?.role === 'admin' && (
                                    <button
                                        onClick={() => setShowAddMemberModal(true)}
                                        className="flex items-center gap-2 bg-[#5865F2] hover:bg-[#4752C4] text-white px-3 py-1.5 rounded text-sm font-semibold transition-colors"
                                    >
                                        <FiUserPlus />
                                        Add Member
                                    </button>
                                )}
                                <span className="text-[#949BA4] text-xs font-semibold uppercase tracking-wide">
                                    Showing {channelMembers.length} Members
                                </span>
                            </div>
                        </div>

                        {/* Add Member Modal Overlay */}
                        {showAddMemberModal && (
                            <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-[60]">
                                <div className="bg-[#313338] w-[400px] rounded-lg shadow-lg p-6">
                                    <div className="flex justify-between items-center mb-4">
                                        <h4 className="text-white font-bold text-lg">Add Member</h4>
                                        <button onClick={() => setShowAddMemberModal(false)} className="text-gray-400 hover:text-white">
                                            <FiXCircle />
                                        </button>
                                    </div>
                                    <div className="max-h-[300px] overflow-y-auto space-y-2 custom-scrollbar pr-2">
                                        {allUsers.filter(u => !channelMembers.some(m => m.id === u.id)).map(u => (
                                            <div key={u.id} className="flex justify-between items-center p-2 hover:bg-[#2b2d31] rounded">
                                                <div className="text-white text-sm">
                                                    <div className="font-bold">{u.name}</div>
                                                    <div className="text-xs text-gray-400">{u.email}</div>
                                                </div>
                                                <button
                                                    onClick={() => handleAddMember(u.id)}
                                                    className="bg-green-600 text-white px-2 py-1 rounded text-xs hover:bg-green-700"
                                                >
                                                    Add
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Member List Table */}
                        <div className="flex-1 overflow-y-auto bg-[#2b2d31] custom-scrollbar">
                            <table className="w-full text-left border-separate border-spacing-0">
                                <thead className="bg-[#2b2d31] sticky top-0 z-10">
                                    <tr>
                                        <th className="px-6 py-3 text-xs font-bold text-[#949BA4] uppercase tracking-wider border-b border-[#1e1f22]">Name</th>
                                        <th className="px-6 py-3 text-xs font-bold text-[#949BA4] uppercase tracking-wider border-b border-[#1e1f22]">Roles</th>
                                        <th className="px-6 py-3 text-xs font-bold text-[#949BA4] uppercase tracking-wider border-b border-[#1e1f22]">Joined At</th>
                                        <th className="px-6 py-3 text-right text-xs font-bold text-[#949BA4] uppercase tracking-wider border-b border-[#1e1f22]">Signals</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[#1e1f22]">
                                    {channelMembers.map((member) => (
                                        <tr key={member.id} className="group hover:bg-[#34363c] transition-colors cursor-pointer">
                                            {/* Name Column */}
                                            <td className="px-6 py-3 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <div className="h-10 w-10 rounded-full bg-[#5865F2] flex items-center justify-center text-white font-bold mr-3 relative">
                                                        {member.name.charAt(0).toUpperCase()}
                                                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-[#2b2d31] rounded-full"></div>
                                                    </div>
                                                    <div>
                                                        <div className="text-sm font-semibold text-white group-hover:underline">{member.name}</div>
                                                        {/* Email hidden as per request */}
                                                        {/* <div className="text-xs text-[#949BA4]">{member.email}</div> */}
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Roles Column */}
                                            <td className="px-6 py-3 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <span className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-[#248045] text-white text-[10px] font-bold uppercase tracking-wide">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-white"></span>
                                                        {member.role === 'admin' ? 'Admin' : member.role === 'faculty' ? 'Faculty' : 'Student'}
                                                    </span>
                                                </div>
                                            </td>

                                            {/* Joined At Column */}
                                            <td className="px-6 py-3 whitespace-nowrap text-xs text-[#949BA4] font-medium">
                                                {member.joined_at ? format(new Date(member.joined_at), 'MMM d, yyyy') : '-'}
                                            </td>

                                            {/* Actions / Signals Column */}
                                            <td className="px-6 py-3 whitespace-nowrap text-right text-sm">
                                                <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); handleKickMember(member.id); }}
                                                        className="text-[#949BA4] hover:text-red-500 p-2 rounded-md hover:bg-[#1e1f22] transition-colors"
                                                        title="Kick Member"
                                                    >
                                                        <FiTrash2 />
                                                    </button>
                                                    <button className="text-[#949BA4] hover:text-white p-2 rounded-md hover:bg-[#1e1f22] transition-colors">
                                                        <FiMoreVertical />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* Helper Icon for Modal Close (because I used FiXCircle but didn't import it in replaced content, 
               let me patch the imports in next thought or just use FiX which is imported as FiX? 
               Wait, I see FiX is not imported. I imported FiX as FiX... 
               Actually I see FiUsers, etc. I need to make sure FiXCircle is imported or use FiX. 
               Checked imports: FiArrowLeft, FiHash, FiLock, FiUserCheck, FiSend, FiUsers, FiTrash2, FiShield, FiMoreVertical, FiSearch.
               Missing FiXCircle. I will use a simple textual X or add import.
               Actually I should just fix the content I'm writing right now.
               I'll use an SVG or add FiX to imports. 
               Let's update imports in the content string above before calling tool.
               
               ... Corrected imports in the tool call below ... 
            */}

            {/* Admin Management Modal */}
            {showAdminModal && (
                <div className="fixed inset-0 z-50 overflow-hidden bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-[#1e1f22] w-full max-w-2xl rounded-xl shadow-2xl overflow-hidden flex flex-col font-sans">
                        <div className="p-6 border-b border-[#2b2d31] flex justify-between items-center bg-[#2b2d31]">
                            <div className="flex items-center gap-2">
                                <FiShield className="text-[#949BA4]" />
                                <h3 className="text-white font-bold text-lg">Channel Admins</h3>
                            </div>
                            <button onClick={() => setShowAdminModal(false)} className="text-[#949BA4] hover:text-white transition-colors">
                                <FiXCircle />
                            </button>
                        </div>

                        <div className="p-6 space-y-6">
                            {/* Current Admins */}
                            <div>
                                <h4 className="text-xs font-bold text-[#949BA4] uppercase tracking-wide mb-3">Current Admins</h4>
                                <div className="space-y-2">
                                    {channelAdmins.length === 0 ? (
                                        <p className="text-[#949BA4] text-sm italic">No admins assigned yet.</p>
                                    ) : (
                                        channelAdmins.map(admin => (
                                            <div key={admin.id} className="flex items-center justify-between bg-[#2b2d31] p-3 rounded-md">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-[#5865F2] flex items-center justify-center text-white font-bold text-sm">
                                                        {admin.name.charAt(0).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <p className="text-white font-bold text-sm">{admin.name}</p>
                                                        <p className="text-[#949BA4] text-xs">{admin.email}</p>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => handleRemoveAdmin(admin.id)}
                                                    className="text-red-400 hover:text-red-500 hover:bg-red-500/10 p-2 rounded transition-colors"
                                                    title="Remove Admin"
                                                >
                                                    <FiTrash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>

                            {/* Add New Admin */}
                            <div>
                                <h4 className="text-xs font-bold text-[#949BA4] uppercase tracking-wide mb-3">Add New Admin</h4>
                                <div className="bg-[#2b2d31] rounded-md border border-[#1e1f22] max-h-60 overflow-y-auto custom-scrollbar">
                                    {facultyUsers.filter(u => !channelAdmins.some(a => a.id === u.id)).map(user => (
                                        <div key={user.id} className="flex items-center justify-between p-3 hover:bg-[#34363c] transition-colors border-b border-[#1e1f22] last:border-0">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center text-white font-bold text-sm">
                                                    {user.name.charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <p className="text-white font-bold text-sm">{user.name}</p>
                                                    <p className="text-[#949BA4] text-xs">{user.role}</p>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => handleAddAdmin(user.id)}
                                                className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-xs font-bold transition-colors"
                                            >
                                                Add
                                            </button>
                                        </div>
                                    ))}
                                    {facultyUsers.filter(u => !channelAdmins.some(a => a.id === u.id)).length === 0 && (
                                        <div className="p-4 text-center text-[#949BA4] text-sm">
                                            No more eligible users to add.
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </Layout >
    )
}

function FiXCircle() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
    )
}
