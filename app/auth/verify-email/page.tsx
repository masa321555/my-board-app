'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import {
  Container,
  Box,
  Paper,
  Typography,
  Button,
  CircularProgress,
  Alert,
} from '@mui/material';
import { CheckCircle, Email } from '@mui/icons-material';

export default function VerifyEmailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();
  const [mounted, setMounted] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState<'pending' | 'success' | 'error'>('pending');

  // コンポーネントのマウント状態を管理
  useEffect(() => {
    setMounted(true);
    return () => {
      setMounted(false);
    };
  }, []);

  // 認証済みの場合は掲示板にリダイレクト
  useEffect(() => {
    if (mounted && status === 'authenticated' && session?.user?.emailVerified) {
      router.push('/board');
    }
  }, [mounted, status, session, router]);

  const handleResendEmail = async () => {
    if (!mounted) return;
    
    setIsVerifying(true);
    try {
      // メール再送信のAPIを呼び出す（実装が必要）
      // const response = await fetch('/api/auth/resend-verification', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ email: session?.user?.email }),
      // });
      
      // 仮の成功メッセージ
      setVerificationStatus('success');
    } catch (error) {
      setVerificationStatus('error');
    } finally {
      if (mounted) {
        setIsVerifying(false);
      }
    }
  };

  const handleGoToBoard = () => {
    if (mounted) {
      router.push('/board');
    }
  };

  // マウント前はローディング表示
  if (!mounted || status === 'loading') {
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
          <CircularProgress />
        </Box>
      </Container>
    );
  }

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
          <Email sx={{ fontSize: 64, color: 'primary.main', mb: 2 }} />
          
          <Typography component="h1" variant="h4" gutterBottom>
            メール確認
          </Typography>
          
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            ご登録いただいたメールアドレスに確認メールを送信しました。
            <br />
            メール内のリンクをクリックして、アカウントの確認を完了してください。
          </Typography>

          {verificationStatus === 'success' && (
            <Alert severity="success" sx={{ mb: 3 }}>
              確認メールを再送信しました。メールボックスをご確認ください。
            </Alert>
          )}

          {verificationStatus === 'error' && (
            <Alert severity="error" sx={{ mb: 3 }}>
              メールの送信に失敗しました。しばらく時間をおいてから再度お試しください。
            </Alert>
          )}

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Button
              variant="outlined"
              onClick={handleResendEmail}
              disabled={isVerifying}
              startIcon={isVerifying ? <CircularProgress size={20} /> : <Email />}
            >
              {isVerifying ? '送信中...' : '確認メールを再送信'}
            </Button>

            <Button
              variant="contained"
              onClick={handleGoToBoard}
              startIcon={<CheckCircle />}
            >
              掲示板に進む
            </Button>
          </Box>

          <Typography variant="body2" color="text.secondary" sx={{ mt: 3 }}>
            メールが届かない場合は、迷惑メールフォルダもご確認ください。
          </Typography>

          {/* 開発環境でのメッセージ */}
          {process.env.NODE_ENV === 'development' && (
            <Alert severity="info" sx={{ mt: 3 }}>
              開発環境では、メール確認は自動的にスキップされます。
              <Button 
                size="small" 
                onClick={() => router.push('/board')} 
                sx={{ ml: 1 }}
              >
                掲示板へ進む
              </Button>
            </Alert>
          )}
        </Paper>
      </Box>
    </Container>
  );
}
