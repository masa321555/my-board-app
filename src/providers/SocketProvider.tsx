'use client'

import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { Socket } from 'socket.io-client'
import { connectSocket, disconnectSocket, getSocket, NotificationEvent } from '@/lib/socket'

interface SocketContextType {
  socket: Socket | null
  isConnected: boolean
  notifications: NotificationEvent[]
  unreadCount: number
  markAsRead: (notificationId: string) => void
  markAllAsRead: () => void
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
  notifications: [],
  unreadCount: 0,
  markAsRead: () => {},
  markAllAsRead: () => {},
})

export const useSocket = () => {
  const context = useContext(SocketContext)
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider')
  }
  return context
}

interface SocketProviderProps {
  children: React.ReactNode
}

export function SocketProvider({ children }: SocketProviderProps) {
  const { data: session, status } = useSession()
  const [socket, setSocket] = useState<Socket | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [notifications, setNotifications] = useState<NotificationEvent[]>([])
  const [unreadCount, setUnreadCount] = useState(0)

  // 通知を既読にする
  const markAsRead = useCallback((notificationId: string) => {
    setNotifications((prev) =>
      prev.map((notif) =>
        notif.id === notificationId ? { ...notif, read: true } : notif
      )
    )
    setUnreadCount((prev) => Math.max(0, prev - 1))
    
    // サーバーに既読を通知
    socket?.emit('notification:read', { notificationId })
  }, [socket])

  // すべての通知を既読にする
  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => prev.map((notif) => ({ ...notif, read: true })))
    setUnreadCount(0)
    
    // サーバーに既読を通知
    socket?.emit('notification:readAll')
  }, [socket])

  useEffect(() => {
    // 認証済みの場合のみSocket.ioに接続
    if (status === 'authenticated' && session?.user) {
      const token = (session as any).accessToken || ''
      
      // 非同期関数で接続を行う
      const initSocket = async () => {
        try {
          const socketInstance = await connectSocket(token)
          setSocket(socketInstance)

          // 接続状態の管理
          socketInstance.on('connect', () => {
            setIsConnected(true)
            console.log('Socket connected')
            
            // 未読通知の取得
            socketInstance.emit('notification:getUnread')
          })

          socketInstance.on('disconnect', () => {
            setIsConnected(false)
            console.log('Socket disconnected')
          })

          // 通知イベントのリスナー
          socketInstance.on('notification:new', (notification: NotificationEvent) => {
            setNotifications((prev) => [notification, ...prev])
            if (!notification.read) {
              setUnreadCount((prev) => prev + 1)
            }
            
            // ブラウザ通知（許可されている場合）
            if ('Notification' in window && Notification.permission === 'granted') {
              new Notification('新しい通知', {
                body: notification.message,
                icon: '/favicon.ico',
              })
            }
          })

          // 未読通知の一括受信
          socketInstance.on('notification:unread', (data: { notifications: NotificationEvent[], count: number }) => {
            setNotifications(data.notifications)
            setUnreadCount(data.count)
          })

          // 通知の更新
          socketInstance.on('notification:updated', (updatedNotification: NotificationEvent) => {
            setNotifications((prev) =>
              prev.map((notif) =>
                notif.id === updatedNotification.id ? updatedNotification : notif
              )
            )
          })
        } catch (error) {
          console.error('Socket connection error:', error)
        }
      }

      initSocket()

      return () => {
        disconnectSocket()
        setSocket(null)
        setIsConnected(false)
      }
    }
  }, [session, status])

  // ブラウザ通知の許可リクエスト
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission()
    }
  }, [])

  return (
    <SocketContext.Provider
      value={{
        socket,
        isConnected,
        notifications,
        unreadCount,
        markAsRead,
        markAllAsRead,
      }}
    >
      {children}
    </SocketContext.Provider>
  )
}