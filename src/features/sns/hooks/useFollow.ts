'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { followApi } from '../api/client'
import { FollowStats } from '../types'

// フォロー状態を取得するフック
export function useFollowStats(userId: string) {
  return useQuery({
    queryKey: ['followStats', userId],
    queryFn: () => followApi.getFollowStats(userId),
    enabled: !!userId,
  })
}

// フォロー/アンフォローのフック
export function useToggleFollow() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ userId, isFollowing }: { userId: string; isFollowing: boolean }) => {
      if (isFollowing) {
        return followApi.unfollow(userId)
      } else {
        return followApi.follow(userId)
      }
    },
    onSuccess: (data, { userId }) => {
      // フォロー統計を更新
      queryClient.setQueryData(['followStats', userId], data)
      
      // フォロワー/フォロー中リストを無効化
      queryClient.invalidateQueries({ queryKey: ['followers', userId] })
      queryClient.invalidateQueries({ queryKey: ['following'] })
      
      // タイムラインを無効化（フォロー中の投稿が変わるため）
      queryClient.invalidateQueries({ queryKey: ['timeline', 'following'] })
    },
  })
}

// フォロワー一覧を取得するフック
export function useFollowers(userId: string, page = 1, limit = 20) {
  return useQuery({
    queryKey: ['followers', userId, page, limit],
    queryFn: () => followApi.getFollowers(userId, page, limit),
    enabled: !!userId,
  })
}

// フォロー中一覧を取得するフック
export function useFollowing(userId: string, page = 1, limit = 20) {
  return useQuery({
    queryKey: ['following', userId, page, limit],
    queryFn: () => followApi.getFollowing(userId, page, limit),
    enabled: !!userId,
  })
}