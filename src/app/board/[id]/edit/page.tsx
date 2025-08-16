'use client';

import { useState, useEffect } from 'react';
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

interface Post {
  _id: string;
  title: string;
  content: string;
  author: {
    _id: string;
  };
}

export default function EditPostPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    }
  }, [status, router]);

  useEffect(() => {
    if (status === 'authenticated') {
      fetchPost();
    }
  }, [status, params.id]);

  const fetchPost = async () => {
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch(`/api/posts/${params.id}`);
      
      if (!response.ok) {
        throw new Error('投稿の取得に失敗しました');
      }

      const data: Post = await response.json();
      
      // 作成者本人かチェック
      if (session?.user?.id !== data.author._id) {
        throw new Error('編集権限がありません');
      }

      setTitle(data.title);
      setContent(data.content);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'エラーが発生しました');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSaving(true);

    try {
      const response = await fetch(`/api/posts/${params.id}`, {
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

      router.push(`/board/${params.id}`);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'エラーが発生しました');
    } finally {
      setIsSaving(false);
    }
  };

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
        onClick={() => router.push(`/board/${params.id}`)}
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
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <TextField
            fullWidth
            label="タイトル"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            disabled={isSaving}
            sx={{ mb: 3 }}
            inputProps={{ maxLength: 200 }}
            helperText={`${title.length}/200文字`}
          />

          <TextField
            fullWidth
            label="本文"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            required
            disabled={isSaving}
            multiline
            rows={10}
            sx={{ mb: 3 }}
            inputProps={{ maxLength: 5000 }}
            helperText={`${content.length}/5000文字`}
          />

          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              type="submit"
              variant="contained"
              disabled={isSaving || !title.trim() || !content.trim()}
              sx={{ minWidth: 120 }}
            >
              {isSaving ? <CircularProgress size={24} /> : '更新する'}
            </Button>
            <Button
              variant="outlined"
              onClick={() => router.push(`/board/${params.id}`)}
              disabled={isSaving}
            >
              キャンセル
            </Button>
          </Box>
        </Box>
      </Paper>
    </Container>
  );
}