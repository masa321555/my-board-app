'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState, lazy, Suspense } from 'react'

// DevToolsを動的インポート（開発環境のみ）
const ReactQueryDevtools = lazy(() =>
  process.env.NODE_ENV === 'development'
    ? import('@tanstack/react-query-devtools').then((m) => ({
        default: m.ReactQueryDevtools,
      }))
    : Promise.resolve({ default: () => null })
)

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // キャッシュ時間：5分
            staleTime: 5 * 60 * 1000,
            // ウィンドウフォーカス時の再取得を無効化（必要に応じて変更）
            refetchOnWindowFocus: false,
            // リトライ回数
            retry: 1,
            // リトライ間隔
            retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
          },
          mutations: {
            // ミューテーションのリトライ
            retry: 1,
          },
        },
      })
  )

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {process.env.NODE_ENV === 'development' && (
        <Suspense fallback={null}>
          <ReactQueryDevtools initialIsOpen={false} />
        </Suspense>
      )}
    </QueryClientProvider>
  )
}