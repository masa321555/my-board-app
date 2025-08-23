'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { notificationApi } from '../api/client'
import { useSocket } from '@/providers/SocketProvider'
import { useEffect } from 'react'

// 通知一覧を取得するフック
export function useNotifications(page = 1, limit = 20, unreadOnly = false) {
  const { socket } = useSocket()
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: ['notifications', page, limit, unreadOnly],
    queryFn: () => notificationApi.getNotifications({ page, limit, unreadOnly }),
  })

  // Socket.ioからの新着通知を監視
  useEffect(() => {
    if (!socket) return

    const handleNewNotification = () => {
      // 通知リストを再取得
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
      queryClient.invalidateQueries({ queryKey: ['unreadCount'] })
    }

    socket.on('notification:new', handleNewNotification)
    socket.on('notification:updated', handleNewNotification)

    return () => {
      socket.off('notification:new', handleNewNotification)
      socket.off('notification:updated', handleNewNotification)
    }
  }, [socket, queryClient])

  return query
}

// 未読通知数を取得するフック
export function useUnreadCount() {
  const { unreadCount } = useSocket()
  
  const query = useQuery({
    queryKey: ['unreadCount'],
    queryFn: () => notificationApi.getUnreadCount(),
    refetchInterval: 60000, // 1分ごとに再取得
  })

  // Socket.ioからの値とAPI取得値の両方を考慮
  return {
    ...query,
    data: { count: unreadCount || query.data?.count || 0 },
  }
}

// 通知を既読にするフック
export function useMarkAsRead() {
  const queryClient = useQueryClient()
  const { markAsRead: socketMarkAsRead } = useSocket()

  return useMutation({
    mutationFn: async (notificationId: string) => {
      // Socket.io経由でも既読を送信
      socketMarkAsRead(notificationId)
      return notificationApi.markAsRead(notificationId)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
      queryClient.invalidateQueries({ queryKey: ['unreadCount'] })
    },
  })
}

// すべての通知を既読にするフック
export function useMarkAllAsRead() {
  const queryClient = useQueryClient()
  const { markAllAsRead: socketMarkAllAsRead } = useSocket()

  return useMutation({
    mutationFn: async () => {
      // Socket.io経由でも既読を送信
      socketMarkAllAsRead()
      return notificationApi.markAllAsRead()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
      queryClient.invalidateQueries({ queryKey: ['unreadCount'] })
    },
  })
}