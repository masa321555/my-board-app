'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import {
  Container,
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Alert,
  CircularProgress,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

export default function NewPostPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const mountedRef = useRef(false);
  // 動的キー生成（より安定したキー）- Hooksの順序を保つためここに配置
  const dynamicKey = useRef(Date.now()).current;

  // マウント状態の管理
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // 安全な状態更新関数
  const safeSetState = useCallback((setter: () => void) => {
    if (mountedRef.current) {
      setter();
    }
  }, []);

  // 認証状態の確認
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    }
  }, [status, router]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!mountedRef.current || isLoading || isNavigating) return;
    
    safeSetState(() => {
      setError('');
      setIsLoading(true);
    });

    try {
      const response = await fetch('/api/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          content,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '投稿の作成に失敗しました');
      }

      safeSetState(() => {
        setIsNavigating(true);
      });

      // より長い遅延を入れてからリダイレクト
      setTimeout(() => {
        if (mountedRef.current) {
          try {
            router.push('/board');
          } catch (navError) {
            console.error('Navigation error:', navError);
            // フォールバック: 手動でページをリロード
            window.location.href = '/board';
          }
        }
      }, 2000);
    } catch (error) {
      safeSetState(() => {
        setError(error instanceof Error ? error.message : 'エラーが発生しました');
        setIsLoading(false);
      });
    }
  }, [isLoading, isNavigating, title, content, safeSetState, router]);

  const handleTitleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (mountedRef.current && !isLoading && !isNavigating) {
      safeSetState(() => {
        setTitle(e.target.value);
      });
    }
  }, [isLoading, isNavigating, safeSetState]);

  const handleContentChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (mountedRef.current && !isLoading && !isNavigating) {
      safeSetState(() => {
        setContent(e.target.value);
      });
    }
  }, [isLoading, isNavigating, safeSetState]);

  const handleBackClick = useCallback(() => {
    if (mountedRef.current && !isLoading && !isNavigating) {
      try {
        router.push('/board');
      } catch (navError) {
        console.error('Navigation error:', navError);
        // フォールバック: 手動でページをリロード
        window.location.href = '/board';
      }
    }
  }, [isLoading, isNavigating, router]);

  const handleCancelClick = useCallback(() => {
    if (mountedRef.current && !isLoading && !isNavigating) {
      try {
        router.push('/board');
      } catch (navError) {
        console.error('Navigation error:', navError);
        // フォールバック: 手動でページをリロード
        window.location.href = '/board';
      }
    }
  }, [isLoading, isNavigating, router]);

  // マウント前はローディング表示
  if (status === 'loading') {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress />
      </Box>
    );
  }

  // 認証されていない場合は何も表示しない
  if (status === 'unauthenticated') {
    return null;
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Button
        startIcon={<ArrowBackIcon />}
        onClick={handleBackClick}
        sx={{ mb: 2 }}
        disabled={isLoading || isNavigating}
      >
        掲示板に戻る
      </Button>

      <Paper sx={{ p: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          新規投稿
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
            fullWidth
            label="タイトル"
            value={title}
            onChange={handleTitleChange}
            required
            disabled={isLoading || isNavigating}
            sx={{ mb: 3 }}
            inputProps={{ maxLength: 100 }}
            helperText={`${title.length}/100文字`}
            key={`title-${dynamicKey}`}
          />

          <TextField
            fullWidth
            label="本文"
            value={content}
            onChange={handleContentChange}
            required
            disabled={isLoading || isNavigating}
            multiline
            rows={10}
            sx={{ mb: 3 }}
            inputProps={{ maxLength: 1000 }}
            helperText={`${content.length}/1000文字`}
            key={`content-${dynamicKey}`}
          />

          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              type="submit"
              variant="contained"
              disabled={isLoading || isNavigating || !title.trim() || !content.trim()}
              sx={{ minWidth: 120 }}
            >
              {isLoading ? <CircularProgress size={24} /> : '投稿する'}
            </Button>
            <Button
              variant="outlined"
              onClick={handleCancelClick}
              disabled={isLoading || isNavigating}
            >
              キャンセル
            </Button>
          </Box>
        </Box>
      </Paper>
    </Container>
  );
}