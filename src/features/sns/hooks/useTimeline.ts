'use client'

import { useInfiniteQuery } from '@tanstack/react-query'
import { timelineApi } from '../api/client'
import { TimelineParams } from '../types'

// タイムラインを取得するフック（無限スクロール対応）
export function useTimeline(type: TimelineParams['type'] = 'all', limit = 20) {
  return useInfiniteQuery({
    queryKey: ['timeline', type],
    queryFn: ({ pageParam = 1 }) => 
      timelineApi.getTimeline({ 
        page: pageParam, 
        limit, 
        type 
      }),
    getNextPageParam: (lastPage) => {
      if (lastPage.page < lastPage.totalPages) {
        return lastPage.page + 1
      }
      return undefined
    },
    initialPageParam: 1,
  })
}

// ユーザーの投稿一覧を取得するフック
export function useUserPosts(userId: string, limit = 20) {
  return useInfiniteQuery({
    queryKey: ['userPosts', userId],
    queryFn: ({ pageParam = 1 }) => 
      timelineApi.getUserPosts(userId, pageParam, limit),
    getNextPageParam: (lastPage) => {
      if (lastPage.page < lastPage.totalPages) {
        return lastPage.page + 1
      }
      return undefined
    },
    initialPageParam: 1,
    enabled: !!userId,
  })
}