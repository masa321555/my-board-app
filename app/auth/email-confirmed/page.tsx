'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Container,
  Box,
  Paper,
  Typography,
  Button,
  Alert,
} from '@mui/material';
import { CheckCircle, Error, Warning } from '@mui/icons-material';

export default function EmailConfirmedPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const status = searchParams.get('status');

  const statusConfig = {
    success: {
      icon: <CheckCircle sx={{ fontSize: 64, color: 'success.main' }} />,
      title: 'メールアドレスが確認されました！',
      message: 'アカウントの確認が完了しました。ログインして掲示板をご利用ください。',
      buttonText: 'ログインする',
      buttonAction: () => router.push('/auth/signin'),
      alertType: 'success' as const,
    },
    'already-verified': {
      icon: <Warning sx={{ fontSize: 64, color: 'warning.main' }} />,
      title: '既に確認済みです',
      message: 'このメールアドレスは既に確認済みです。ログインして掲示板をご利用ください。',
      buttonText: 'ログインする',
      buttonAction: () => router.push('/auth/signin'),
      alertType: 'info' as const,
    },
    error: {
      icon: <Error sx={{ fontSize: 64, color: 'error.main' }} />,
      title: '確認に失敗しました',
      message: 'メールアドレスの確認に失敗しました。リンクの有効期限が切れているか、無効なリンクの可能性があります。',
      buttonText: 'ログインページへ',
      buttonAction: () => router.push('/auth/signin'),
      alertType: 'error' as const,
    },
  };

  const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.error;

  useEffect(() => {
    // 5秒後に自動的にログインページへリダイレクト（成功時のみ）
    if (status === 'success') {
      const timer = setTimeout(() => {
        router.push('/auth/signin');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [status, router]);

  return (
    <Container component="main" maxWidth="sm">
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Paper elevation={3} sx={{ padding: 4, width: '100%', textAlign: 'center' }}>
          {config.icon}
          
          <Typography component="h1" variant="h4" gutterBottom sx={{ mt: 2 }}>
            {config.title}
          </Typography>
          
          <Alert severity={config.alertType} sx={{ mt: 3, mb: 3 }}>
            {config.message}
          </Alert>

          <Button
            variant="contained"
            size="large"
            onClick={config.buttonAction}
            sx={{ mt: 2 }}
          >
            {config.buttonText}
          </Button>

          {status === 'success' && (
            <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
              5秒後に自動的にログインページへ移動します
            </Typography>
          )}
        </Paper>
      </Box>
    </Container>
  );
}