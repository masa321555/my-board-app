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
  CircularProgress,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import StableAlert from '@/components/StableAlert';

export default function NewPostPage() {
  const router = useRouter();
  const { status } = useSession();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
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
      window.location.href = '/auth/signin';
    }
  }, [status]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!mountedRef.current || isLoading) return;
    
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

      // 投稿成功時は直接window.location.hrefを使用
      setTimeout(() => {
        window.location.href = '/board';
      }, 500);
    } catch (error) {
      safeSetState(() => {
        setError(error instanceof Error ? error.message : 'エラーが発生しました');
        setIsLoading(false);
      });
    }
  }, [isLoading, title, content, safeSetState, router]);

  const handleTitleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (mountedRef.current && !isLoading) {
      safeSetState(() => {
        setTitle(e.target.value);
      });
    }
  }, [isLoading, safeSetState]);

  const handleContentChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (mountedRef.current && !isLoading) {
      safeSetState(() => {
        setContent(e.target.value);
      });
    }
  }, [isLoading, safeSetState]);

  const handleBackClick = useCallback(() => {
    if (!isLoading) {
      window.location.href = '/board';
    }
  }, [isLoading]);

  const handleCancelClick = useCallback(() => {
    if (!isLoading) {
      window.location.href = '/board';
    }
  }, [isLoading]);

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
        disabled={isLoading}
      >
        掲示板に戻る
      </Button>

      <Paper sx={{ p: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          新規投稿
        </Typography>

        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 3 }}>
          <StableAlert
            open={!!error}
            severity="error"
            onClose={() => setError('')}
          >
            {error}
          </StableAlert>

          <TextField
            fullWidth
            label="タイトル"
            name="title"
            value={title}
            onChange={handleTitleChange}
            required
            disabled={isLoading}
            sx={{ mb: 3 }}
            inputProps={{ maxLength: 100 }}
            helperText={`${title.length}/100文字`}
            key={`title-${dynamicKey}`}
          />

          <TextField
            fullWidth
            label="本文"
            name="content"
            value={content}
            onChange={handleContentChange}
            required
            disabled={isLoading}
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
              disabled={isLoading || !title.trim() || !content.trim()}
              sx={{ minWidth: 120 }}
            >
              {isLoading ? <CircularProgress size={24} /> : '投稿する'}
            </Button>
            <Button
              variant="outlined"
              onClick={handleCancelClick}
              disabled={isLoading}
            >
              キャンセル
            </Button>
          </Box>
        </Box>
      </Paper>
    </Container>
  );
}