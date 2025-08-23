// SNS機能の型定義

export interface Follow {
  _id: string
  follower: string
  following: string
  createdAt: Date
  updatedAt: Date
}

export interface Like {
  _id: string
  user: string
  targetType: 'post' | 'comment'
  targetId: string
  createdAt: Date
  updatedAt: Date
}

export interface Comment {
  _id: string
  content: string
  author: string
  authorName: string
  authorAvatar?: string
  postId: string
  parentCommentId?: string
  likes: number
  likedByUser?: boolean
  replies?: Comment[]
  createdAt: Date
  updatedAt: Date
  deletedAt?: Date
}

export interface Notification {
  _id: string
  recipient: string
  sender: string
  senderName: string
  senderAvatar?: string
  type: 'follow' | 'like' | 'comment' | 'mention'
  targetType?: 'post' | 'comment'
  targetId?: string
  message: string
  read: boolean
  readAt?: Date
  createdAt: Date
  updatedAt: Date
}

// APIレスポンスの型
export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  totalPages: number
  hasMore: boolean
}

export interface FollowStats {
  followersCount: number
  followingCount: number
  isFollowing: boolean
  isFollower: boolean
}

export interface PostWithStats {
  _id: string
  title: string
  content: string
  author: string
  authorName: string
  authorAvatar?: string
  views: number
  likesCount: number
  commentsCount: number
  likedByUser: boolean
  visibility: 'public' | 'followers' | 'private'
  mentions: string[]
  hashtags: string[]
  createdAt: Date
  updatedAt: Date
}

// リクエストパラメータの型
export interface TimelineParams {
  page?: number
  limit?: number
  type?: 'all' | 'following' | 'popular'
}

export interface CommentParams {
  postId: string
  content: string
  parentCommentId?: string
}

export interface NotificationParams {
  page?: number
  limit?: number
  unreadOnly?: boolean
}