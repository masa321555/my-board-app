'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import {
  Container,
  Box,
  Paper,
  Typography,
  Button,
  CircularProgress,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import StableAlert from '@/components/StableAlert';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';

interface Post {
  _id: string;
  title: string;
  content: string;
  author: {
    _id: string;
    name: string;
    email: string;
  };
  authorName: string;
  createdAt: string;
  updatedAt: string;
}

export default function PostDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [post, setPost] = useState<Post | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

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

      const data = await response.json();
      setPost(data);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'エラーが発生しました');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      const response = await fetch(`/api/posts/${params.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('投稿の削除に失敗しました');
      }

      router.push('/board');
    } catch (error) {
      setError(error instanceof Error ? error.message : 'エラーが発生しました');
    }
  };

  if (status === 'loading' || isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress />
      </Box>
    );
  }

  if (error && !post) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <StableAlert 
              open={!!error}
              severity="error" 
              sx={{ mb: 2 }}
              onClose={() => setError('')}
            >
              {error}
            </StableAlert>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => router.push('/board')}
        >
          掲示板に戻る
        </Button>
      </Container>
    );
  }

  if (!post) {
    return null;
  }

  const isAuthor = session?.user?.id === post.author._id;

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => router.push('/board')}
        >
          掲示板に戻る
        </Button>
        
        {isAuthor && (
          <Box>
            <Button
              startIcon={<EditIcon />}
              onClick={() => router.push(`/board/${params.id}/edit`)}
              sx={{ mr: 1 }}
            >
              編集
            </Button>
            <Button
              startIcon={<DeleteIcon />}
              color="error"
              onClick={() => setDeleteDialogOpen(true)}
            >
              削除
            </Button>
          </Box>
        )}
      </Box>

      <Paper sx={{ p: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          {post.title}
        </Typography>
        
        <Typography variant="body2" color="text.secondary" gutterBottom>
          投稿者: {post.authorName}
        </Typography>
        
        <Typography variant="body2" color="text.secondary">
          投稿日時: {format(new Date(post.createdAt), 'yyyy年MM月dd日 HH:mm', { locale: ja })}
        </Typography>
        
        {post.createdAt !== post.updatedAt && (
          <Typography variant="body2" color="text.secondary">
            更新日時: {format(new Date(post.updatedAt), 'yyyy年MM月dd日 HH:mm', { locale: ja })}
          </Typography>
        )}
        
        <Divider sx={{ my: 3 }} />
        
        <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
          {post.content}
        </Typography>
      </Paper>

      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>投稿を削除しますか？</DialogTitle>
        <DialogContent>
          <Typography>
            この操作は取り消すことができません。本当に削除してもよろしいですか？
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>
            キャンセル
          </Button>
          <Button onClick={handleDelete} color="error" variant="contained">
            削除
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}