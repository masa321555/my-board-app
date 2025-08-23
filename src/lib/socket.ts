import { io, Socket } from 'socket.io-client'

let socket: Socket | null = null

export const getSocket = (): Socket => {
  if (!socket) {
    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001'
    
    socket = io(socketUrl, {
      autoConnect: false,
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    })

    // デバッグ用のイベントリスナー（開発環境のみ）
    if (process.env.NODE_ENV === 'development') {
      socket.on('connect', () => {
        console.log('Socket.io connected:', socket?.id)
      })

      socket.on('disconnect', (reason) => {
        console.log('Socket.io disconnected:', reason)
      })

      socket.on('error', (error) => {
        console.error('Socket.io error:', error)
      })
    }
  }

  return socket
}

export const connectSocket = (token?: string) => {
  const socket = getSocket()
  
  if (token) {
    socket.auth = { token }
  }
  
  if (!socket.connected) {
    socket.connect()
  }
  
  return socket
}

export const disconnectSocket = () => {
  if (socket?.connected) {
    socket.disconnect()
  }
}

// 通知用のイベントタイプ
export type NotificationEvent = {
  id: string
  type: 'follow' | 'like' | 'comment' | 'mention'
  message: string
  senderId: string
  senderName: string
  targetId?: string
  createdAt: string
  read: boolean
}