// SNS機能用のAPIクライアント

import { 
  Follow, 
  Like, 
  Comment, 
  Notification, 
  PaginatedResponse, 
  FollowStats,
  PostWithStats,
  TimelineParams,
  CommentParams,
  NotificationParams 
} from '../types'

const API_BASE = '/api'

// 共通のfetch設定
const fetchConfig: RequestInit = {
  headers: {
    'Content-Type': 'application/json',
  },
  credentials: 'include',
}

// エラーハンドリング
async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'An error occurred' }))
    throw new Error(error.message || `HTTP error! status: ${response.status}`)
  }
  return response.json()
}

// フォロー関連API
export const followApi = {
  follow: async (userId: string): Promise<FollowStats> => {
    const response = await fetch(`${API_BASE}/users/${userId}/follow`, {
      ...fetchConfig,
      method: 'POST',
    })
    return handleResponse(response)
  },

  unfollow: async (userId: string): Promise<FollowStats> => {
    const response = await fetch(`${API_BASE}/users/${userId}/follow`, {
      ...fetchConfig,
      method: 'DELETE',
    })
    return handleResponse(response)
  },

  getFollowers: async (userId: string, page = 1, limit = 20): Promise<PaginatedResponse<Follow>> => {
    const params = new URLSearchParams({ page: String(page), limit: String(limit) })
    const response = await fetch(`${API_BASE}/users/${userId}/followers?${params}`, fetchConfig)
    return handleResponse(response)
  },

  getFollowing: async (userId: string, page = 1, limit = 20): Promise<PaginatedResponse<Follow>> => {
    const params = new URLSearchParams({ page: String(page), limit: String(limit) })
    const response = await fetch(`${API_BASE}/users/${userId}/following?${params}`, fetchConfig)
    return handleResponse(response)
  },

  getFollowStats: async (userId: string): Promise<FollowStats> => {
    const response = await fetch(`${API_BASE}/users/${userId}/follow-stats`, fetchConfig)
    return handleResponse(response)
  },
}

// タイムライン関連API
export const timelineApi = {
  getTimeline: async (params: TimelineParams): Promise<PaginatedResponse<PostWithStats>> => {
    const searchParams = new URLSearchParams()
    if (params.page) searchParams.append('page', String(params.page))
    if (params.limit) searchParams.append('limit', String(params.limit))
    if (params.type) searchParams.append('type', params.type)
    
    const response = await fetch(`${API_BASE}/timeline?${searchParams}`, fetchConfig)
    return handleResponse(response)
  },

  getUserPosts: async (userId: string, page = 1, limit = 20): Promise<PaginatedResponse<PostWithStats>> => {
    const params = new URLSearchParams({ page: String(page), limit: String(limit) })
    const response = await fetch(`${API_BASE}/users/${userId}/posts?${params}`, fetchConfig)
    return handleResponse(response)
  },
}

// いいね関連API
export const likeApi = {
  like: async (targetType: 'post' | 'comment', targetId: string): Promise<{ liked: boolean; count: number }> => {
    const response = await fetch(`${API_BASE}/${targetType}s/${targetId}/like`, {
      ...fetchConfig,
      method: 'POST',
    })
    return handleResponse(response)
  },

  unlike: async (targetType: 'post' | 'comment', targetId: string): Promise<{ liked: boolean; count: number }> => {
    const response = await fetch(`${API_BASE}/${targetType}s/${targetId}/like`, {
      ...fetchConfig,
      method: 'DELETE',
    })
    return handleResponse(response)
  },

  getLikes: async (targetType: 'post' | 'comment', targetId: string, page = 1, limit = 20): Promise<PaginatedResponse<Like>> => {
    const params = new URLSearchParams({ page: String(page), limit: String(limit) })
    const response = await fetch(`${API_BASE}/${targetType}s/${targetId}/likes?${params}`, fetchConfig)
    return handleResponse(response)
  },
}

// コメント関連API
export const commentApi = {
  create: async (params: CommentParams): Promise<Comment> => {
    const response = await fetch(`${API_BASE}/posts/${params.postId}/comments`, {
      ...fetchConfig,
      method: 'POST',
      body: JSON.stringify({
        content: params.content,
        parentCommentId: params.parentCommentId,
      }),
    })
    return handleResponse(response)
  },

  getComments: async (postId: string, page = 1, limit = 20): Promise<PaginatedResponse<Comment>> => {
    const params = new URLSearchParams({ page: String(page), limit: String(limit) })
    const response = await fetch(`${API_BASE}/posts/${postId}/comments?${params}`, fetchConfig)
    return handleResponse(response)
  },

  update: async (commentId: string, content: string): Promise<Comment> => {
    const response = await fetch(`${API_BASE}/comments/${commentId}`, {
      ...fetchConfig,
      method: 'PUT',
      body: JSON.stringify({ content }),
    })
    return handleResponse(response)
  },

  delete: async (commentId: string): Promise<{ success: boolean }> => {
    const response = await fetch(`${API_BASE}/comments/${commentId}`, {
      ...fetchConfig,
      method: 'DELETE',
    })
    return handleResponse(response)
  },
}

// 通知関連API
export const notificationApi = {
  getNotifications: async (params: NotificationParams): Promise<PaginatedResponse<Notification> & { unreadCount: number }> => {
    const searchParams = new URLSearchParams()
    if (params.page) searchParams.append('page', String(params.page))
    if (params.limit) searchParams.append('limit', String(params.limit))
    if (params.unreadOnly) searchParams.append('unreadOnly', String(params.unreadOnly))
    
    const response = await fetch(`${API_BASE}/notifications?${searchParams}`, fetchConfig)
    return handleResponse(response)
  },

  markAsRead: async (notificationId: string): Promise<Notification> => {
    const response = await fetch(`${API_BASE}/notifications/${notificationId}/read`, {
      ...fetchConfig,
      method: 'PUT',
    })
    return handleResponse(response)
  },

  markAllAsRead: async (): Promise<{ success: boolean; readCount: number }> => {
    const response = await fetch(`${API_BASE}/notifications/read-all`, {
      ...fetchConfig,
      method: 'PUT',
    })
    return handleResponse(response)
  },

  getUnreadCount: async (): Promise<{ count: number }> => {
    const response = await fetch(`${API_BASE}/notifications/unread-count`, fetchConfig)
    return handleResponse(response)
  },
}