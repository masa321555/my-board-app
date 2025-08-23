'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { likeApi } from '../api/client'

// いいね/いいね解除のフック
export function useToggleLike() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ 
      targetType, 
      targetId, 
      isLiked 
    }: { 
      targetType: 'post' | 'comment'
      targetId: string
      isLiked: boolean 
    }) => {
      if (isLiked) {
        return likeApi.unlike(targetType, targetId)
      } else {
        return likeApi.like(targetType, targetId)
      }
    },
    onMutate: async ({ targetType, targetId, isLiked }) => {
      // 楽観的更新のためにクエリをキャンセル
      await queryClient.cancelQueries({ queryKey: [targetType, targetId] })

      // 前の値を保存
      const previousData = queryClient.getQueryData([targetType, targetId])

      // 楽観的更新
      queryClient.setQueryData([targetType, targetId], (old: any) => {
        if (!old) return old
        return {
          ...old,
          likedByUser: !isLiked,
          likesCount: isLiked ? old.likesCount - 1 : old.likesCount + 1,
        }
      })

      return { previousData }
    },
    onError: (err, variables, context) => {
      // エラー時は前の値に戻す
      if (context?.previousData) {
        queryClient.setQueryData(
          [variables.targetType, variables.targetId], 
          context.previousData
        )
      }
    },
    onSuccess: (data, { targetType, targetId }) => {
      // 関連するクエリを無効化
      queryClient.invalidateQueries({ queryKey: [targetType, targetId] })
      queryClient.invalidateQueries({ queryKey: ['likes', targetType, targetId] })
    },
  })
}