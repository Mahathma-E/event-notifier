'use client'

import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import {
  FiHome,
  FiBell,
  FiPlusCircle,
  FiBarChart2,
  FiUsers,
  FiLogOut,
  FiMenu,
  FiX,
  FiUser,
  FiCheckCircle,
  FiHash,
} from 'react-icons/fi'

interface LayoutProps {
  children: React.ReactNode
}

export default function Layout({ children }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { user, logout } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  const handleLogout = () => {
    logout()
  }

  const menuItems = [
    { href: '/dashboard', label: 'Dashboard', icon: FiHome },
    { href: '/notifications', label: 'Notifications', icon: FiBell },
    ...(user?.role === 'admin' || user?.role === 'faculty'
      ? [{ href: '/notifications/create', label: 'Create Notice', icon: FiPlusCircle }]
      : []),
    ...(user?.role === 'admin' || user?.role === 'faculty'
      ? [{ href: '/analytics', label: 'Analytics', icon: FiBarChart2 }]
      : []),
    ...(user?.role === 'admin' ? [{ href: '/users', label: 'Users', icon: FiUsers }] : []),
    { href: '/channels', label: 'Channels', icon: FiHash },
    { href: '/od', label: 'OD Requests', icon: FiCheckCircle },
    { href: '/profile', label: 'Profile', icon: FiUser },
  ]

  return (
    <div className="min-h-screen bg-black text-dark-text-main font-sans">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-white/10 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-50 h-full w-[275px] bg-black border-r border-dark-border transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          } overflow-y-auto`}
      >
        <div className="flex flex-col h-full p-4">
          {/* Logo */}
          <div className="px-4 py-3 mb-4">
            <img src="/g-logo.png" alt="GCE Notify" className="h-10 w-auto" />
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center space-x-4 px-4 py-3 rounded-full text-xl transition-colors ${isActive
                    ? 'font-bold text-white'
                    : 'text-dark-text-main hover:bg-dark-hover'
                    }`}
                >
                  <Icon className={`w-7 h-7 ${isActive ? 'text-white' : ''}`} />
                  <span>{item.label}</span>
                </Link>
              )
            })}
          </nav>

          {/* User Profile Pill at Bottom */}
          <div className="mt-auto pt-4">
            <div className="flex items-center justify-between p-3 rounded-full hover:bg-dark-hover cursor-pointer transition-colors group">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 bg-dark-card rounded-full flex items-center justify-center text-white border border-dark-border">
                  {(user?.name || 'U').charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0 hidden sm:block">
                  <p className="text-base font-bold text-white truncate">{user?.name || 'User'}</p>
                  <p className="text-sm text-dark-text-muted truncate">@{user?.role || 'user'}</p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="text-dark-text-muted hover:text-red-500 p-2"
                title="Logout"
              >
                <FiLogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="lg:pl-[275px] min-h-screen border-r border-dark-border w-full">
        {/* Top Mobile Header */}
        <header className="lg:hidden sticky top-0 z-30 bg-black/80 backdrop-blur-md border-b border-dark-border">
          <div className="flex items-center justify-between px-4 py-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 -ml-2 rounded-full hover:bg-dark-hover text-white"
            >
              <FiMenu className="w-6 h-6" />
            </button>
            <div className="flex items-center gap-3">
              <img src="/g-logo.png" alt="GCE Notify" className="h-8 w-auto" />
              <h1 className="text-lg font-bold text-white">GCE Notify</h1>
            </div>
            <div className="w-8"></div> {/* Spacer for center alignment */}
          </div>
        </header>

        {/* Page Content */}
        <main className="min-h-screen">
          {children}
        </main>
      </div>

      {/* Right Sidebar Placeholder (Twitter/Discord style often has a right panel) - Optional, can stay empty for now to center content */}
    </div>
  )
}
