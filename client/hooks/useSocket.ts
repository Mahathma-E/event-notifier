'use client'

import { useEffect, useRef } from 'react'
import { io, Socket } from 'socket.io-client'
import { useAuth } from '@/contexts/AuthContext'

export function useSocket() {
  const { user } = useAuth()
  const socketRef = useRef<Socket | null>(null)

  useEffect(() => {
    if (user) {
      const socket = io(process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:5000', {
        transports: ['websocket'],
      })

      socket.on('connect', () => {
        console.log('Connected to server')
        socket.emit('join-room', user.id)
      })

      socketRef.current = socket

      return () => {
        socket.disconnect()
      }
    }
  }, [user])

  return socketRef.current
}
