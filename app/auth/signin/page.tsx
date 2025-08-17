'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { signIn, useSession } from 'next-auth/react';
import { useSearchParams, useRouter } from 'next/navigation';
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
import Link from 'next/link';
import { Suspense } from 'react';

function SignInContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const callbackUrl = searchParams.get('callbackUrl') || '/dashboard';
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  
  const mountedRef = useRef(false);
  const isSubmittingRef = useRef(false);
  const navigationTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (navigationTimeoutRef.current) {
        clearTimeout(navigationTimeoutRef.current);
      }
    };
  }, []);

  const safeSetState = useCallback((updater: () => void) => {
    if (mountedRef.current) {
      updater();
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
      // エラーメッセージをクリア
      if (error) {
        setError('');
      }
    });
  }, [isLoading, isNavigating, error, safeSetState]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!mountedRef.current || isSubmittingRef.current || isLoading || isNavigating) return;
    
    safeSetState(() => {
      setError('');
      setIsLoading(true);
    });
    isSubmittingRef.current = true;

    try {
      const result = await signIn('credentials', {
        email: formData.email,
        password: formData.password,
        redirect: false,
      });

      if (!mountedRef.current) return;

      if (result?.error) {
        safeSetState(() => {
          setError('メールアドレスまたはパスワードが正しくありません');
          setIsLoading(false);
        });
        isSubmittingRef.current = false;
      } else if (result?.ok) {
        safeSetState(() => {
          setIsNavigating(true);
        });
        
        // ナビゲーション処理
        navigationTimeoutRef.current = setTimeout(() => {
          if (mountedRef.current && !isNavigating) {
            try {
              const url = decodeURIComponent(callbackUrl);
              if (url.startsWith('/') || url.startsWith(window.location.origin)) {
                router.push(url);
              } else {
                window.location.href = url;
              }
            } catch (navError) {
              console.error('Navigation error:', navError);
              try {
                router.push(decodeURIComponent(callbackUrl));
              } catch (fallbackError) {
                console.error('Fallback navigation error:', fallbackError);
                if (mountedRef.current && !isNavigating) {
                  window.location.href = decodeURIComponent(callbackUrl);
                }
              }
            }
          }
        }, 2000);
        return;
      }
    } catch (error) {
      console.error('Sign in error:', error);
      if (mountedRef.current) {
        safeSetState(() => {
          setError('ログインに失敗しました');
          setIsLoading(false);
        });
        isSubmittingRef.current = false;
      }
    }
    
    if (mountedRef.current) {
      safeSetState(() => {
        setIsLoading(false);
      });
      isSubmittingRef.current = false;
    }
  }, [formData, callbackUrl, isLoading, isNavigating, safeSetState, router]);

  const handlePasswordToggle = useCallback(() => {
    if (mountedRef.current && !isLoading && !isNavigating) {
      safeSetState(() => {
        setShowPassword(prev => !prev);
      });
    }
  }, [isLoading, isNavigating, safeSetState]);

  // マウント前またはナビゲーション中はローディング表示
  if (!mountedRef.current || isNavigating) {
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
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
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
              value={formData.email}
              onChange={handleChange}
              disabled={isLoading}
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