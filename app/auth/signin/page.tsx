'use client';

import { useState, useCallback, Suspense, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { signIn } from 'next-auth/react';
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
  InputAdornment,
  IconButton,
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';

function SignInContent() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/dashboard';
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const isSubmitting = useRef(false);
  const navigationTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const mountedRef = useRef(false);

  // マウント状態の管理
  useEffect(() => {
    mountedRef.current = true;[01:09:43.438] Running build in Washington, D.C., USA (East) – iad1
[01:09:43.439] Build machine configuration: 4 cores, 8 GB
[01:09:43.460] Cloning github.com/masa321555/my-board-app (Branch: main, Commit: 96065d8)
[01:09:43.573] Previous build caches not available
[01:09:43.739] Cloning completed: 279.000ms
[01:09:45.885] Running "vercel build"
[01:09:46.340] Vercel CLI 45.0.10
[01:09:47.022] Running "install" command: `npm install --production=false`...
[01:09:47.315] npm warn config production Use `--omit=dev` instead.
[01:09:48.387] npm warn ERESOLVE overriding peer dependency
[01:09:48.388] npm warn While resolving: @auth/core@0.40.0
[01:09:48.388] npm warn Found: nodemailer@7.0.5
[01:09:48.388] npm warn node_modules/nodemailer
[01:09:48.388] npm warn   nodemailer@"^7.0.5" from the root project
[01:09:48.388] npm warn
[01:09:48.388] npm warn Could not resolve dependency:
[01:09:48.388] npm warn peerOptional nodemailer@"^6.8.0" from @auth/core@0.40.0
[01:09:48.389] npm warn node_modules/@auth/core
[01:09:48.389] npm warn   @auth/core@"0.40.0" from @auth/mongodb-adapter@3.10.0
[01:09:48.389] npm warn   node_modules/@auth/mongodb-adapter
[01:09:48.389] npm warn
[01:09:48.389] npm warn Conflicting peer dependency: nodemailer@6.10.1
[01:09:48.389] npm warn node_modules/nodemailer
[01:09:48.389] npm warn   peerOptional nodemailer@"^6.8.0" from @auth/core@0.40.0
[01:09:48.389] npm warn   node_modules/@auth/core
[01:09:48.389] npm warn     @auth/core@"0.40.0" from @auth/mongodb-adapter@3.10.0
[01:09:48.389] npm warn     node_modules/@auth/mongodb-adapter
[01:09:49.466] npm error code ERESOLVE
[01:09:49.466] npm error ERESOLVE could not resolve
[01:09:49.466] npm error
[01:09:49.466] npm error While resolving: next-auth@4.24.11
[01:09:49.466] npm error Found: @auth/core@0.40.0
[01:09:49.466] npm error node_modules/@auth/core
[01:09:49.467] npm error   @auth/core@"0.40.0" from @auth/mongodb-adapter@3.10.0
[01:09:49.467] npm error   node_modules/@auth/mongodb-adapter
[01:09:49.467] npm error     @auth/mongodb-adapter@"^3.10.0" from the root project
[01:09:49.467] npm error
[01:09:49.467] npm error Could not resolve dependency:
[01:09:49.467] npm error peerOptional @auth/core@"0.34.2" from next-auth@4.24.11
[01:09:49.467] npm error node_modules/next-auth
[01:09:49.467] npm error   next-auth@"^4.24.11" from the root project
[01:09:49.467] npm error
[01:09:49.467] npm error Conflicting peer dependency: nodemailer@6.10.1
[01:09:49.467] npm error node_modules/nodemailer
[01:09:49.467] npm error   peerOptional nodemailer@"^6.8.0" from @auth/core@0.34.2
[01:09:49.467] npm error   node_modules/@auth/core
[01:09:49.467] npm error     peerOptional @auth/core@"0.34.2" from next-auth@4.24.11
[01:09:49.467] npm error     node_modules/next-auth
[01:09:49.468] npm error       next-auth@"^4.24.11" from the root project
[01:09:49.468] npm error
[01:09:49.468] npm error Fix the upstream dependency conflict, or retry
[01:09:49.468] npm error this command with --force or --legacy-peer-deps
[01:09:49.468] npm error to accept an incorrect (and potentially broken) dependency resolution.
[01:09:49.468] npm error
[01:09:49.468] npm error
[01:09:49.468] npm error For a full report see:
[01:09:49.468] npm error /vercel/.npm/_logs/2025-08-16T16_09_47_272Z-eresolve-report.txt
[01:09:49.468] npm error A complete log of this run can be found in: /vercel/.npm/_logs/2025-08-16T16_09_47_272Z-debug-0.log
[01:09:49.507] Error: Command "npm install --production=false" exited with 1
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

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (!mountedRef.current || isLoading || isNavigating) return;
    
    const { name, value } = e.target;
    safeSetState(() => {
      setFormData(prev => ({
        ...prev,
        [name]: value,
      }));
    });
  }, [isLoading, isNavigating, safeSetState]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!mountedRef.current || isSubmitting.current || isLoading || isNavigating) return;
    
    safeSetState(() => {
      setError('');
      setIsLoading(true);
    });
    isSubmitting.current = true;

    try {
      const result = await signIn('credentials', {
        email: formData.email,
        password: formData.password,
        redirect: false,
      });

      if (!mountedRef.current) return; // コンポーネントがアンマウントされた場合は何もしない

      if (result?.error) {
        safeSetState(() => {
          setError('メールアドレスまたはパスワードが正しくありません');
          setIsLoading(false);
        });
      } else if (result?.ok) {
        safeSetState(() => {
          setIsNavigating(true);
        });
        
        // より長い遅延を入れてからリダイレクト
        navigationTimeoutRef.current = setTimeout(() => {
          if (mountedRef.current) {
            try {
              // 成功時は直接window.locationでリダイレクト（DOM操作を避ける）
              window.location.href = decodeURIComponent(callbackUrl);
            } catch (navError) {
              console.error('Navigation error:', navError);
              // フォールバック: 手動でページをリロード
              window.location.href = decodeURIComponent(callbackUrl);
            }
          }
        }, 2000); // 遅延を2秒に延長
        return; // 早期リターンで処理を終了
      }
    } catch (error) {
      console.error('Sign in error:', error);
      if (mountedRef.current) {
        safeSetState(() => {
          setError('ログインに失敗しました');
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
  }, [formData, callbackUrl, isLoading, isNavigating, safeSetState]);

  const handlePasswordToggle = useCallback(() => {
    if (mountedRef.current && !isLoading && !isNavigating) {
      safeSetState(() => {
        setShowPassword(prev => !prev);
      });
    }
  }, [isLoading, isNavigating, safeSetState]);

  // マウント前またはナビゲーション中はローディング表示
  if (!mounted || isNavigating) {
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
            {isNavigating ? 'ログイン中、掲示板ページへ移動中...' : '読み込み中...'}
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
            ログイン
          </Typography>
          
          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 3 }}>
            <Alert 
              severity="error" 
              sx={{ mb: 2, display: error ? 'flex' : 'none' }} 
              key={`error-${dynamicKey}`}
            >
              {error}
            </Alert>
            
            <TextField
              margin="normal"
              required
              fullWidth
              id="email"
              label="メールアドレス"
              name="email"
              autoComplete="email"
              autoFocus
              value={formData.email}
              onChange={handleChange}
              disabled={isLoading}
              key={`email-${dynamicKey}`}
            />
            
            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="パスワード"
              type={showPassword ? 'text' : 'password'}
              id="password"
              autoComplete="current-password"
              value={formData.password}
              onChange={handleChange}
              disabled={isLoading}
              key={`password-${dynamicKey}`}
              slotProps={{
                input: {
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label="toggle password visibility"
                        onClick={handlePasswordToggle}
                        edge="end"
                        disabled={isLoading}
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                },
              }}
            />
            
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2 }}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <CircularProgress size={20} sx={{ mr: 1 }} />
                  ログイン中...
                </>
              ) : (
                'ログイン'
              )}
            </Button>
            
            <Box sx={{ textAlign: 'center' }}>
              <Link href="/auth/forgot-password" style={{ textDecoration: 'none' }}>
                <Typography variant="body2" color="primary" sx={{ mb: 1 }}>
                  パスワードを忘れた方
                </Typography>
              </Link>
              
              <Typography variant="body2">
                アカウントをお持ちでない方は
                <Link href="/auth/register" style={{ textDecoration: 'none' }}>
                  <Typography component="span" color="primary" sx={{ ml: 0.5 }}>
                    新規登録
                  </Typography>
                </Link>
              </Typography>
            </Box>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
}

export default function SignInPage() {
  return (
    <Suspense 
      fallback={
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
      }
    >
      <SignInContent />
    </Suspense>
  );
}