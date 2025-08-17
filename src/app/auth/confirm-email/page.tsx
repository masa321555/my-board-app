'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  Container,
  Box,
  Typography,
  Paper,
  CircularProgress,
  Button,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';

function ConfirmEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('無効な確認リンクです');
      return;
    }

    const verifyEmail = async () => {
      try {
        const response = await fetch('/api/auth/verify-email', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ token }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'メール確認に失敗しました');
        }

        setStatus('success');
        setMessage('メールアドレスの確認が完了しました');
      } catch (error) {
        setStatus('error');
        setMessage(error instanceof Error ? error.message : 'エラーが発生しました');
      }
    };

    verifyEmail();
  }, [token]);

  return (
    <Container component="main" maxWidth="xs">
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Paper elevation={3} sx={{ padding: 4, width: '100%', textAlign: 'center' }}>
          {status === 'loading' && (
            <>
              <CircularProgress size={60} sx={{ mb: 3 }} />
              <Typography variant="h6">
                メールアドレスを確認しています...
              </Typography>
            </>
          )}
          
          {status === 'success' && (
            <>
              <CheckCircleIcon color="success" sx={{ fontSize: 60, mb: 3 }} />
              <Typography variant="h5" sx={{ mb: 2 }}>
                確認完了
              </Typography>
              <Alert severity="success" sx={{ mb: 3 }}>
                {message}
              </Alert>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                ログインページからログインしてください。
              </Typography>
              <Link href="/auth/signin" style={{ textDecoration: 'none' }}>
                <Button variant="contained" fullWidth>
                  ログインページへ
                </Button>
              </Link>
            </>
          )}
          
          {status === 'error' && (
            <>
              <ErrorIcon color="error" sx={{ fontSize: 60, mb: 3 }} />
              <Typography variant="h5" sx={{ mb: 2 }}>
                確認失敗
              </Typography>
              <Alert severity="error" sx={{ mb: 3 }}>
                {message}
              </Alert>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                リンクが無効または期限切れの可能性があります。
              </Typography>
              <Link href="/auth/register" style={{ textDecoration: 'none' }}>
                <Button variant="outlined" fullWidth>
                  新規登録ページへ
                </Button>
              </Link>
            </>
          )}
        </Paper>
      </Box>
    </Container>
  );
}

export default function ConfirmEmailPage() {
  return (
    <Suspense fallback={<CircularProgress />}>
      <ConfirmEmailContent />
    </Suspense>
  );
}