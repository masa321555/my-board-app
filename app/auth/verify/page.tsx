'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  Container,
  Box,
  Typography,
  Alert,
  Paper,
  CircularProgress,
  Button,
  Fade,
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  Email as EmailIcon,
} from '@mui/icons-material';

function VerifyContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const statusParam = searchParams.get('status');
  const messageParam = searchParams.get('message');
  
  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'already-verified'>('loading');
  const [message, setMessage] = useState('');
  const [userInfo, setUserInfo] = useState<{ email?: string; name?: string } | null>(null);

  useEffect(() => {
    // URLパラメータからエラー状態を確認
    if (statusParam === 'error') {
      setStatus('error');
      if (messageParam === 'invalid-token') {
        setMessage('メール確認リンクが無効です。新規登録からやり直してください。');
      } else {
        setMessage('エラーが発生しました。');
      }
      return;
    }

    if (!token) {
      setStatus('error');
      setMessage('無効な確認リンクです。メールに記載されたリンクからアクセスしてください。');
      return;
    }

    const verifyEmail = async () => {
      try {
        const response = await fetch('/api/auth/verify', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ token }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || data.error || 'メール確認に失敗しました');
        }

        if (data.alreadyVerified) {
          setStatus('already-verified');
          setMessage(data.message);
        } else {
          setStatus('success');
          setMessage(data.message);
          if (data.user) {
            setUserInfo(data.user);
          }
        }
      } catch (error) {
        setStatus('error');
        setMessage(error instanceof Error ? error.message : 'エラーが発生しました');
      }
    };

    verifyEmail();
  }, [token, statusParam, messageParam]);

  const getIcon = () => {
    switch (status) {
      case 'success':
        return <CheckCircleIcon sx={{ fontSize: 80, color: 'success.main' }} />;
      case 'already-verified':
        return <WarningIcon sx={{ fontSize: 80, color: 'warning.main' }} />;
      case 'error':
        return <ErrorIcon sx={{ fontSize: 80, color: 'error.main' }} />;
      default:
        return <EmailIcon sx={{ fontSize: 80, color: 'primary.main' }} />;
    }
  };

  const getTitle = () => {
    switch (status) {
      case 'success':
        return 'メール確認完了！';
      case 'already-verified':
        return '確認済みです';
      case 'error':
        return '確認失敗';
      default:
        return 'メール確認中...';
    }
  };

  const getAlertSeverity = () => {
    switch (status) {
      case 'success':
        return 'success';
      case 'already-verified':
        return 'info';
      case 'error':
        return 'error';
      default:
        return 'info';
    }
  };

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
          <Fade in timeout={600}>
            <Box>
              {getIcon()}
              
              <Typography variant="h4" sx={{ mt: 3, mb: 2, fontWeight: 'bold' }}>
                {getTitle()}
              </Typography>

              {status === 'loading' ? (
                <>
                  <CircularProgress sx={{ mb: 3 }} />
                  <Typography variant="body1" color="text.secondary">
                    メールアドレスを確認しています...
                  </Typography>
                </>
              ) : (
                <>
                  <Alert severity={getAlertSeverity()} sx={{ mb: 3, textAlign: 'left' }}>
                    {message}
                  </Alert>

                  {userInfo && userInfo.name && (
                    <Typography variant="body1" sx={{ mb: 3 }}>
                      ようこそ、{userInfo.name}さん！
                    </Typography>
                  )}

                  {status === 'success' && (
                    <>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                        アカウントが有効化されました。
                        ログインして掲示板の全機能をご利用いただけます。
                      </Typography>
                      <Link href="/auth/signin" style={{ textDecoration: 'none' }}>
                        <Button variant="contained" size="large" fullWidth>
                          ログインページへ
                        </Button>
                      </Link>
                    </>
                  )}

                  {status === 'already-verified' && (
                    <>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                        既にアカウントは有効化されています。
                        ログインしてご利用ください。
                      </Typography>
                      <Link href="/auth/signin" style={{ textDecoration: 'none' }}>
                        <Button variant="contained" size="large" fullWidth>
                          ログインページへ
                        </Button>
                      </Link>
                    </>
                  )}

                  {status === 'error' && (
                    <>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                        メール確認に失敗しました。
                        リンクが無効または期限切れの可能性があります。
                      </Typography>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <Link href="/auth/signin" style={{ textDecoration: 'none' }}>
                          <Button variant="outlined" fullWidth>
                            ログインページへ
                          </Button>
                        </Link>
                        <Link href="/auth/register" style={{ textDecoration: 'none' }}>
                          <Button variant="contained" fullWidth>
                            新規登録ページへ
                          </Button>
                        </Link>
                      </Box>
                    </>
                  )}
                </>
              )}
            </Box>
          </Fade>
        </Paper>

        {/* 開発環境向けの情報 */}
        {process.env.NODE_ENV === 'development' && status !== 'loading' && (
          <Alert severity="info" sx={{ mt: 3, width: '100%' }}>
            <Typography variant="caption">
              開発環境：トークン = {token ? `${token.substring(0, 20)}...` : 'なし'}
            </Typography>
          </Alert>
        )}
      </Box>
    </Container>
  );
}

export default function VerifyPage() {
  return (
    <Suspense 
      fallback={
        <Container component="main" maxWidth="sm">
          <Box
            sx={{
              marginTop: 8,
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <CircularProgress />
          </Box>
        </Container>
      }
    >
      <VerifyContent />
    </Suspense>
  );
}