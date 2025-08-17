'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import {
  Box,
  TextField,
  Button,
  Typography,
  Alert,
  Paper,
  CircularProgress,
  InputAdornment,
  IconButton,
  LinearProgress,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Collapse,
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  CheckCircle,
  Cancel,
  Info,
} from '@mui/icons-material';
import { registerSchema, RegisterFormData } from '@/schemas/auth';
import { checkPasswordStrength, getPasswordStrengthColor } from '@/utils/passwordStrength';

export default function RegisterForm() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [serverError, setServerError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const isSubmittingRef = useRef(false);
  const navigationTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const mountedRef = useRef(false);
  const [passwordStrength, setPasswordStrength] = useState({
    score: 0,
    feedback: '',
    suggestions: [] as string[],
    isStrong: false,
  });

  // マウント状態の管理
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

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    trigger,
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    mode: 'onChange',
  });

  const watchPassword = watch('password');

  // パスワード変更時に強度をチェック
  const handlePasswordChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!mountedRef.current || isSubmitting || isNavigating) return;
    
    const password = e.target.value;
    const strength = checkPasswordStrength(password);
    safeSetState(() => {
      setPasswordStrength(strength);
    });
    
    // パスワードフィールドのバリデーションをトリガー
    if (password.length >= 8) {
      await trigger('password');
    }
  }, [isSubmitting, isNavigating, trigger, safeSetState]);

  const onSubmit = useCallback(async (data: RegisterFormData) => {
    if (!mountedRef.current || isSubmittingRef.current || isNavigating) return;
    
    safeSetState(() => {
      setServerError('');
      setSuccessMessage('');
      setIsSubmitting(true);
    });
    isSubmittingRef.current = true;

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: data.name,
          email: data.email,
          password: data.password,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        if (mountedRef.current) {
          if (result.details) {
            // パスワード強度エラーの場合
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
        }
        return;
      }

      if (mountedRef.current) {
        safeSetState(() => {
          setSuccessMessage(result.message);
          setIsNavigating(true);
        });
        
        // より長い遅延を入れてからリダイレクト
        navigationTimeoutRef.current = setTimeout(() => {
          if (mountedRef.current) {
            try {
              router.push('/auth/signin');
            } catch (navError) {
              console.error('Navigation error:', navError);
              // フォールバック: 手動でページをリロード
              window.location.href = '/auth/signin';
            }
          }
        }, 3000);
        return; // 早期リターンで処理を終了
      }
    } catch (error) {
      console.error('Registration error:', error);
      if (mountedRef.current) {
        safeSetState(() => {
          setServerError('登録処理中にエラーが発生しました');
        });
      }
    }
    
    // エラー時のみここに到達
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
        setShowPassword(!showPassword);
      });
    }
  }, [showPassword, isSubmitting, isNavigating, safeSetState]);

  const handleConfirmPasswordToggle = useCallback(() => {
    if (mountedRef.current && !isSubmitting && !isNavigating) {
      safeSetState(() => {
        setShowConfirmPassword(!showConfirmPassword);
      });
    }
  }, [showConfirmPassword, isSubmitting, isNavigating, safeSetState]);

  // 動的キー生成（より安定したキー）
  const dynamicKey = useRef(Date.now()).current;

  // マウント前またはナビゲーション中はローディング表示
  if (!mounted || isNavigating) {
    return (
      <Paper elevation={3} sx={{ padding: 4, width: '100%' }}>
        <Box
          sx={{
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
      </Paper>
    );
  }

  return (
    <Paper elevation={3} sx={{ padding: 4, width: '100%' }}>
      <Typography component="h1" variant="h5" align="center">
        新規登録
      </Typography>
      
      <Box component="form" onSubmit={handleSubmit(onSubmit)} sx={{ mt: 3 }}>
        <Alert 
          severity="error" 
          sx={{ mb: 2, display: serverError ? 'flex' : 'none' }} 
          key={`error-${dynamicKey}`}
        >
          {serverError}
        </Alert>
        
        <Alert 
          severity="success" 
          sx={{ mb: 2, display: successMessage ? 'flex' : 'none' }} 
          key={`success-${dynamicKey}`}
        >
          {successMessage}
        </Alert>
        
        <TextField
          {...register('name')}
          margin="normal"
          required
          fullWidth
          id="name"
          label="お名前"
          autoComplete="name"
          autoFocus
          error={!!errors.name}
          helperText={errors.name?.message}
          disabled={isSubmitting || !!successMessage}
          key={`name-${dynamicKey}`}
        />
        
        <TextField
          {...register('email')}
          margin="normal"
          required
          fullWidth
          id="email"
          label="メールアドレス"
          autoComplete="email"
          error={!!errors.email}
          helperText={errors.email?.message}
          disabled={isSubmitting || !!successMessage}
          key={`email-${dynamicKey}`}
        />
        
        <TextField
          {...register('password', {
            onChange: handlePasswordChange,
          })}
          margin="normal"
          required
          fullWidth
          label="パスワード"
          type={showPassword ? 'text' : 'password'}
          id="password"
          autoComplete="new-password"
          error={!!errors.password}
          helperText={errors.password?.message || 'パスワードは8文字以上で設定してください'}
          disabled={isSubmitting || !!successMessage}
          key={`password-${dynamicKey}`}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  aria-label="toggle password visibility"
                  onClick={handlePasswordToggle}
                  edge="end"
                  disabled={isSubmitting || !!successMessage}
                >
                  {showPassword ? <VisibilityOff /> : <Visibility />}
                </IconButton>
              </InputAdornment>
            ),
          }}
        />

        {/* パスワード強度メーター */}
        {watchPassword && (
          <Box sx={{ mt: 1, mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <Typography variant="caption" sx={{ mr: 1 }}>
                パスワード強度:
              </Typography>
              <Typography 
                variant="caption" 
                sx={{ 
                  color: getPasswordStrengthColor(passwordStrength.score),
                  fontWeight: 'bold' 
                }}
              >
                {passwordStrength.feedback}
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={(passwordStrength.score / 4) * 100}
              sx={{
                height: 8,
                borderRadius: 5,
                backgroundColor: '#e0e0e0',
                '& .MuiLinearProgress-bar': {
                  borderRadius: 5,
                  backgroundColor: getPasswordStrengthColor(passwordStrength.score),
                },
              }}
            />
            
            {/* 提案表示 */}
            <Collapse in={passwordStrength.suggestions.length > 0}>
              <List dense sx={{ mt: 1 }}>
                {passwordStrength.suggestions.map((suggestion, index) => (
                  <ListItem key={index} sx={{ py: 0 }}>
                    <ListItemIcon sx={{ minWidth: 30 }}>
                      <Info fontSize="small" color="info" />
                    </ListItemIcon>
                    <ListItemText 
                      primary={suggestion} 
                      primaryTypographyProps={{ variant: 'caption' }}
                    />
                  </ListItem>
                ))}
              </List>
            </Collapse>
          </Box>
        )}
        
        <TextField
          {...register('confirmPassword')}
          margin="normal"
          required
          fullWidth
          label="パスワード（確認）"
          type={showConfirmPassword ? 'text' : 'password'}
          id="confirmPassword"
          autoComplete="new-password"
          error={!!errors.confirmPassword}
          helperText={errors.confirmPassword?.message}
          disabled={isSubmitting || !!successMessage}
          key={`confirmPassword-${dynamicKey}`}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  aria-label="toggle password visibility"
                  onClick={handleConfirmPasswordToggle}
                  edge="end"
                  disabled={isSubmitting || !!successMessage}
                >
                  {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                </IconButton>
              </InputAdornment>
            ),
          }}
        />
        
        <Button
          type="submit"
          fullWidth
          variant="contained"
          sx={{ mt: 3, mb: 2 }}
          disabled={isSubmitting || !!successMessage}
        >
          {isSubmitting ? (
            <>
              <CircularProgress size={20} sx={{ mr: 1 }} />
              登録処理中...
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
  );
}