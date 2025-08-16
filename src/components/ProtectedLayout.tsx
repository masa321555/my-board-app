'use client';

import { ReactNode } from 'react';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { 
  Box, 
  CircularProgress, 
  Container,
  Typography,
  Fade,
} from '@mui/material';
import { LockOutlined } from '@mui/icons-material';

interface ProtectedLayoutProps {
  children: ReactNode;
  requireEmailVerified?: boolean;
}

export default function ProtectedLayout({ 
  children, 
  requireEmailVerified = false 
}: ProtectedLayoutProps) {
  const { session, isLoading, isAuthenticated } = useRequireAuth();

  // ローディング中
  if (isLoading) {
    return (
      <Container>
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '80vh',
            gap: 2,
          }}
        >
          <CircularProgress size={60} />
          <Typography variant="body1" color="text.secondary">
            読み込み中...
          </Typography>
        </Box>
      </Container>
    );
  }

  // 未認証（通常はミドルウェアでリダイレクトされるが、念のため）
  if (!isAuthenticated) {
    return (
      <Container>
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '80vh',
            gap: 2,
          }}
        >
          <LockOutlined sx={{ fontSize: 80, color: 'text.secondary' }} />
          <Typography variant="h5" color="text.secondary">
            このページにアクセスするにはログインが必要です
          </Typography>
          <Typography variant="body2" color="text.secondary">
            リダイレクト中...
          </Typography>
        </Box>
      </Container>
    );
  }

  // メール確認が必要な場合
  if (requireEmailVerified && !session?.user?.emailVerified) {
    return (
      <Container>
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '80vh',
            gap: 2,
            textAlign: 'center',
          }}
        >
          <LockOutlined sx={{ fontSize: 80, color: 'warning.main' }} />
          <Typography variant="h5">
            メールアドレスの確認が必要です
          </Typography>
          <Typography variant="body2" color="text.secondary">
            この機能を利用するには、メールアドレスの確認を完了してください。
          </Typography>
        </Box>
      </Container>
    );
  }

  // 認証済みの場合はコンテンツを表示
  return (
    <Fade in={isAuthenticated} timeout={300}>
      <Box>{children}</Box>
    </Fade>
  );
}