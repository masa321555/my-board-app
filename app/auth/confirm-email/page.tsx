'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Container,
  Box,
  CircularProgress,
  Typography,
} from '@mui/material';

export default function ConfirmEmailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  useEffect(() => {
    if (!token) {
      // トークンがない場合はエラーページへ
      router.replace('/auth/email-confirmed?status=error');
      return;
    }

    // GETリクエストでメール確認を実行
    // APIがリダイレクトを返すので、直接アクセス
    window.location.href = `/api/auth/confirm-email?token=${encodeURIComponent(token)}`;
  }, [token, router]);

  return (
    <Container component="main" maxWidth="sm">
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          minHeight: '60vh',
        }}
      >
        <CircularProgress size={60} />
        <Typography variant="h6" sx={{ mt: 3 }}>
          メールアドレスを確認しています...
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
          しばらくお待ちください
        </Typography>
      </Box>
    </Container>
  );
}