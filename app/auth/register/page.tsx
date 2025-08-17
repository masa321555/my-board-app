'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { registerSchema, type RegisterFormData } from '@/schemas/auth';
import { checkPasswordStrength } from '@/utils/passwordStrength';
import {
  Container,
  Box,
  TextField,
  Button,
  Typography,
  Paper,
  CircularProgress,
  InputAdornment,
  IconButton,
  LinearProgress,
} from '@mui/material';
import SafeAlert from '@/components/SafeAlert';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import Link from 'next/link';
import { Suspense } from 'react';

function RegisterContent() {
  const router = useRouter();
  
  const [serverError, setServerError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState({
    score: 0,
    feedback: '',
    suggestions: [] as string[],
    isStrong: false,
  });
  
  const mountedRef = useRef(true);
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

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
    setError,
    clearErrors,
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    mode: 'onChange',
  });

  const watchedPassword = watch('password', '');
  const watchedConfirmPassword = watch('confirmPassword', '');

  // パスワード強度チェック
  useEffect(() => {
    if (!mountedRef.current) return;
    
    if (watchedPassword) {
      const strength = checkPasswordStrength(watchedPassword);
      safeSetState(() => {
        setPasswordStrength(strength);
      });
    } else {
      safeSetState(() => {
        setPasswordStrength({
          score: 0,
          feedback: '',
          suggestions: [],
          isStrong: false,
        });
      });
    }
  }, [watchedPassword, safeSetState]);

  // パスワード確認の一致チェック
  useEffect(() => {
    if (!mountedRef.current) return;
    
    if (watchedConfirmPassword && watchedPassword !== watchedConfirmPassword) {
      setError('confirmPassword', {
        type: 'manual',
        message: 'パスワードが一致しません',
      });
    } else if (watchedConfirmPassword) {
      clearErrors('confirmPassword');
    }
  }, [watchedPassword, watchedConfirmPassword, setError, clearErrors]);

  const onSubmit = useCallback(async (data: RegisterFormData) => {
    if (!mountedRef.current || isSubmittingRef.current || isNavigating) return;
    
    console.log('フォーム送信開始:', { 
      name: data.name, 
      email: data.email, 
      passwordLength: data.password?.length,
      confirmPasswordLength: data.confirmPassword?.length
    });
    
    safeSetState(() => {
      setServerError('');
      setSuccessMessage('');
      setIsSubmitting(true);
    });
    isSubmittingRef.current = true;

    try {
      const requestBody = {
        name: data.name,
        email: data.email,
        password: data.password,
        confirmPassword: data.confirmPassword,
      };
      
      console.log('APIリクエスト送信:', requestBody);
      
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      console.log('APIレスポンス受信:', { 
        status: response.status, 
        statusText: response.statusText 
      });

      const result = await response.json();
      console.log('APIレスポンス内容:', result);

      if (!response.ok) {
        if (mountedRef.current) {
          if (result.details) {
            safeSetState(() => {
              setServerError(result.error);
              if (result.details.suggestions) {
                setPasswordStrength({
                  ...passwordStrength,
                  suggestions: result.details.suggestions,
                });
              }
            });
          } else {
            safeSetState(() => {
              setServerError(result.error || '登録に失敗しました');
            });
          }
          safeSetState(() => {
            setIsSubmitting(false);
          });
          isSubmittingRef.current = false;
        }
        return;
      }

      if (mountedRef.current) {
        safeSetState(() => {
          setSuccessMessage(result.message);
          setIsNavigating(true);
        });
        
        navigationTimeoutRef.current = setTimeout(() => {
          if (mountedRef.current && !isNavigating) {
            try {
              router.push('/auth/signin');
            } catch (navError) {
              console.error('Navigation error:', navError);
              try {
                router.push('/auth/signin');
              } catch (fallbackError) {
                console.error('Fallback navigation error:', fallbackError);
                if (mountedRef.current && !isNavigating) {
                  window.location.href = '/auth/signin';
                }
              }
            }
          }
        }, 3000);
        return;
      }
    } catch (error) {
      console.error('Registration error:', error);
      if (mountedRef.current) {
        safeSetState(() => {
          setServerError('登録処理中にエラーが発生しました');
        });
      }
    }
    
    if (mountedRef.current) {
      safeSetState(() => {
        setIsSubmitting(false);
      });
    }
    isSubmittingRef.current = false;
  }, [router, isNavigating, passwordStrength, safeSetState]);

  const handlePasswordToggle = useCallback(() => {
    if (mountedRef.current && !isSubmitting && !isNavigating) {
      safeSetState(() => {
        setShowPassword(prev => !prev);
      });
    }
  }, [isSubmitting, isNavigating, safeSetState]);

  const handleConfirmPasswordToggle = useCallback(() => {
    if (mountedRef.current && !isSubmitting && !isNavigating) {
      safeSetState(() => {
        setShowConfirmPassword(prev => !prev);
      });
    }
  }, [isSubmitting, isNavigating, safeSetState]);

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
            {isNavigating ? '登録完了、ログインページへ移動中...' : '読み込み中...'}
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
            新規登録
          </Typography>
          
          <Box component="form" onSubmit={handleSubmit(onSubmit)} sx={{ mt: 3 }}>
            <SafeAlert 
              open={!!serverError}
              severity="error" 
              sx={{ mb: 2 }}
              onClose={() => setServerError('')}
            >
              {serverError}
            </SafeAlert>
            
            <SafeAlert 
              open={!!successMessage}
              severity="success" 
              sx={{ mb: 2 }}
              onClose={() => setSuccessMessage('')}
            >
              {successMessage}
            </SafeAlert>
            
            <TextField
              margin="normal"
              required
              fullWidth
              id="name"
              label="お名前"
              autoComplete="name"
              autoFocus
              {...register('name')}
              error={!!errors.name}
              helperText={errors.name?.message}
              disabled={isSubmitting}
            />
            
            <TextField
              margin="normal"
              required
              fullWidth
              id="email"
              label="メールアドレス"
              type="email"
              autoComplete="email"
              {...register('email')}
              error={!!errors.email}
              helperText={errors.email?.message}
              disabled={isSubmitting}
            />
            
            <TextField
              margin="normal"
              required
              fullWidth
              label="パスワード"
              type={showPassword ? 'text' : 'password'}
              id="password"
              autoComplete="new-password"
              {...register('password')}
              error={!!errors.password}
              helperText={errors.password?.message || 'パスワードは8文字以上で設定してください'}
              disabled={isSubmitting}
              slotProps={{
                input: {
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label="toggle password visibility"
                        onClick={handlePasswordToggle}
                        edge="end"
                        disabled={isSubmitting}
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                },
              }}
            />
            
            {/* パスワード強度インジケーター */}
            {watchedPassword && (
              <Box sx={{ mt: 1, mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  パスワード強度: {passwordStrength.feedback}
                </Typography>
                <LinearProgress
                  variant="determinate"
                  value={(passwordStrength.score / 4) * 100}
                  sx={{
                    mt: 0.5,
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: 'grey.200',
                    '& .MuiLinearProgress-bar': {
                      backgroundColor: passwordStrength.isStrong ? 'success.main' : 'warning.main',
                    },
                  }}
                />
                {passwordStrength.suggestions.length > 0 && (
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                    提案: {passwordStrength.suggestions.join(', ')}
                  </Typography>
                )}
              </Box>
            )}
            
            <TextField
              margin="normal"
              required
              fullWidth
              label="パスワード（確認）"
              type={showConfirmPassword ? 'text' : 'password'}
              id="confirmPassword"
              autoComplete="new-password"
              {...register('confirmPassword')}
              error={!!errors.confirmPassword}
              helperText={errors.confirmPassword?.message}
              disabled={isSubmitting}
              slotProps={{
                input: {
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label="toggle confirm password visibility"
                        onClick={handleConfirmPasswordToggle}
                        edge="end"
                        disabled={isSubmitting}
                      >
                        {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
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
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <CircularProgress size={20} sx={{ mr: 1 }} />
                  登録中...
                </>
              ) : (
                '登録する'
              )}
            </Button>
            
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="body2">
                既にアカウントをお持ちの方は
                <Link href="/auth/signin" style={{ textDecoration: 'none' }}>
                  <Typography component="span" color="primary" sx={{ ml: 0.5 }}>
                    ログイン
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

export default function RegisterPage() {
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
      <RegisterContent />
    </Suspense>
  );
}