'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import {
  Container,
  Box,
  TextField,
  Button,
  Typography,
  Alert,
  Paper,
  CircularProgress,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const isSubmitting = useRef(false);
  const navigationTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const mountedRef = useRef(false);

  useEffect(() => {
    mountedRef.current = true;
    setMounted(true);
    return () => {
      mountedRef.current = false;
      setMounted(false);
      if (navigationTimeoutRef.current) {
        clearTimeout(navigationTimeoutRef.current);
        navigationTimeoutRef.current = null;
      }
    };
  }, []);

  // 安全な状態更新関数
  const safeSetState = useCallback((setter: () => void) => {
    if (mountedRef.current) {
      setter();
    }
  }, []);

  const handleEmailChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (mountedRef.current && !isLoading && !success) {
      safeSetState(() => {
        setEmail(e.target.value);
      });
    }
  }, [isLoading, success, safeSetState]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mountedRef.current || isSubmitting.current || isNavigating) return;
    
    safeSetState(() => {
      setError('');
      setSuccess('');
      setIsLoading(true);
    });
    isSubmitting.current = true;

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'リクエストの処理に失敗しました');
      }

      if (mountedRef.current) {
        safeSetState(() => {
          setSuccess('パスワードリセット用のメールを送信しました。メールをご確認ください。');
          setEmail('');
        });
        
        // 成功後の状態をクリア
        navigationTimeoutRef.current = setTimeout(() => {
          if (mountedRef.current) {
            safeSetState(() => {
              setSuccess('');
              setIsLoading(false);
            });
            isSubmitting.current = false;
          }
        }, 3000);
        return; // 早期リターンで処理を終了
      }
    } catch (error) {
      if (mountedRef.current) {
        safeSetState(() => {
          setError(error instanceof Error ? error.message : 'エラーが発生しました');
          setIsLoading(false);
        });
      }
    }
    
    // エラー時のみここに到達
    if (mountedRef.current) {
      safeSetState(() => {
        setIsLoading(false);
      });
    }
    isSubmitting.current = false;
  }, [email, safeSetState]);

  // マウント前またはナビゲーション中はローディング表示
  if (!mounted) {
    return (
      <Container component="main" maxWidth="xs">
        <Box
          sx={{
            marginTop: 8,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            minHeight: '60vh',
          }}
        >
          <CircularProgress />
          <Typography variant="body2" sx={{ mt: 2 }}>
            読み込み中...
          </Typography>
        </Box>
      </Container>
    );
  }

  // 動的キー生成（より安定したキー）
  const dynamicKey = useRef(Date.now()).current;

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
        <Paper elevation={3} sx={{ padding: 4, width: '100%' }}>
          <Typography component="h1" variant="h5" align="center">
            パスワードをリセット
          </Typography>
          
          <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 2 }}>
            登録したメールアドレスを入力してください。
            パスワードリセット用のリンクを送信します。
          </Typography>
          
          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 3 }}>
            {error && (
              <Alert severity="error" sx={{ mb: 2 }} key={`error-${dynamicKey}`}>
                {error}
              </Alert>
            )}
            
            {success && (
              <Alert severity="success" sx={{ mb: 2 }} key={`success-${dynamicKey}`}>
                {success}
              </Alert>
            )}
            
            <TextField
              margin="normal"
              required
              fullWidth
              id="email"
              label="メールアドレス"
              name="email"
              autoComplete="email"
              autoFocus
              value={email}
              onChange={handleEmailChange}
              disabled={isLoading || !!success}
              key={`email-${dynamicKey}`}
            />
            
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2 }}
              disabled={isLoading || !!success}
            >
              {isLoading ? <CircularProgress size={24} /> : 'リセットメールを送信'}
            </Button>
            
            <Box sx={{ textAlign: 'center' }}>
              <Link href="/auth/signin" style={{ textDecoration: 'none' }}>
                <Button startIcon={<ArrowBackIcon />} size="small">
                  ログインに戻る
                </Button>
              </Link>
            </Box>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
}