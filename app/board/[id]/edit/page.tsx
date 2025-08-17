'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { use } from 'react';
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

interface Post {
  id: string;
  title: string;
  content: string;
  author: {
    id: string;
  } | string;
}

export default function EditPostPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const mountedRef = useRef(false);

  // Next.js 15: paramsをReact.use()でアンラップ
  const { id } = use(params);

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

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    }
  }, [status, router]);

  useEffect(() => {
    if (status === 'authenticated') {
      fetchPost();
    }
  }, [status, id]);

  const fetchPost = async () => {
    safeSetState(() => {
      setIsLoading(true);
      setError('');
    });

    try {
      const response = await fetch(`/api/posts/${id}`);
      
      if (!response.ok) {
        throw new Error('投稿の取得に失敗しました');
      }

      const data: Post = await response.json();
      
      // 作成者本人かチェック
      if ((session?.user as any)?.id !== (typeof data.author === 'object' ? data.author.id : data.author)) {
        throw new Error('編集権限がありません');
      }

      safeSetState(() => {
        setTitle(data.title);
        setContent(data.content);
      });
    } catch (_error) {
      safeSetState(() => {
        setError(_error instanceof Error ? _error.message : 'エラーが発生しました');
      });
    } finally {
      safeSetState(() => {
        setIsLoading(false);
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!mountedRef.current || isSaving || isNavigating) return;
    
    safeSetState(() => {
      setError('');
      setIsSaving(true);
    });

    try {
      const response = await fetch(`/api/posts/${id}`, {
        method: 'PUT',
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
        throw new Error(data.error || '投稿の更新に失敗しました');
      }

      safeSetState(() => {
        setIsNavigating(true);
      });

      // より長い遅延を入れてからリダイレクト
      setTimeout(() => {
        if (mountedRef.current) {
          try {
            router.push(`/board/${id}`);
          } catch (navError) {
            console.error('Navigation error:', navError);
            // フォールバック: 手動でページをリロード
            window.location.href = `/board/${id}`;
          }
        }
      }, 2000);
    } catch (_error) {
      safeSetState(() => {
        setError(_error instanceof Error ? _error.message : 'エラーが発生しました');
        setIsSaving(false);
      });
    }
  };

  const handleTitleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (mountedRef.current && !isSaving && !isNavigating) {
      safeSetState(() => {
        setTitle(e.target.value);
      });
    }
  }, [isSaving, isNavigating, safeSetState]);

  const handleContentChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (mountedRef.current && !isSaving && !isNavigating) {
      safeSetState(() => {
        setContent(e.target.value);
      });
    }
  }, [isSaving, isNavigating, safeSetState]);

  // 動的キー生成（より安定したキー）
  const dynamicKey = useRef(Date.now()).current;

  if (status === 'loading' || isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress />
      </Box>
    );
  }

  if (error && !title) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => router.push('/board')}
        >
          掲示板に戻る
        </Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Button
        startIcon={<ArrowBackIcon />}
        onClick={() => router.push(`/board/${id}`)}
        sx={{ mb: 2 }}
      >
        投稿に戻る
      </Button>

      <Paper sx={{ p: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          投稿を編集
        </Typography>

        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 3 }}>
          {error && (
            <Alert 
              severity="error" 
              sx={{ mb: 2 }} 
              key={`error-${dynamicKey}`}
            >
              {error}
            </Alert>
          )}

          <TextField
            fullWidth
            label="タイトル"
            value={title}
            onChange={handleTitleChange}
            required
            disabled={isSaving || isNavigating}
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
            disabled={isSaving || isNavigating}
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
              disabled={isSaving || isNavigating || !title.trim() || !content.trim()}
              sx={{ minWidth: 120 }}
            >
              {isSaving ? <CircularProgress size={24} /> : '更新する'}
            </Button>
            <Button
              variant="outlined"
              onClick={() => router.push(`/board/${id}`)}
              disabled={isSaving || isNavigating}
            >
              キャンセル
            </Button>
          </Box>
        </Box>
      </Paper>
    </Container>
  );
}