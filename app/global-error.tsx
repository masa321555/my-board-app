'use client';

// import * as Sentry from '@sentry/nextjs';
import { useEffect } from 'react';
import { Button } from '@mui/material';
import { useRouter } from 'next/navigation';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();

  useEffect(() => {
    // Sentryにエラーを送信（Sentry設定後に有効化）
    // Sentry.captureException(error, {
    //   tags: {
    //     location: 'global-error',
    //   },
    //   extra: {
    //     digest: error.digest,
    //   },
    // });
    console.error('Global error:', error);
  }, [error]);

  return (
    <html>
      <body>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          textAlign: 'center',
          padding: '20px',
        }}>
          <h1 style={{ fontSize: '2rem', marginBottom: '1rem' }}>
            申し訳ございません
          </h1>
          <p style={{ marginBottom: '2rem', color: '#666' }}>
            予期しないエラーが発生しました。<br />
            問題が続く場合は、サポートまでお問い合わせください。
          </p>
          {process.env.NODE_ENV === 'development' && (
            <pre style={{
              background: '#f5f5f5',
              padding: '1rem',
              borderRadius: '4px',
              marginBottom: '2rem',
              maxWidth: '600px',
              overflow: 'auto',
            }}>
              {error.message}
              {error.stack && '\n\n' + error.stack}
            </pre>
          )}
          <div style={{ display: 'flex', gap: '1rem' }}>
            <Button
              variant="contained"
              onClick={() => reset()}
            >
              再試行
            </Button>
            <Button
              variant="outlined"
              onClick={() => router.push('/')}
            >
              ホームに戻る
            </Button>
          </div>
          {error.digest && (
            <p style={{ marginTop: '2rem', fontSize: '0.875rem', color: '#999' }}>
              エラーID: {error.digest}
            </p>
          )}
        </div>
      </body>
    </html>
  );
}