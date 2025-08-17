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
  Button,
  CircularProgress,
  Alert,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
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

export default function PostDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [post, setPost] = useState<Post | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
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

      const data = await response.json();
      safeSetState(() => {
        setPost(data);
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

  const handleDelete = async () => {
    if (!mountedRef.current || isDeleting || isNavigating) return;

    safeSetState(() => {
      setIsDeleting(true);
    });

    try {
      const response = await fetch(`/api/posts/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('投稿の削除に失敗しました');
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
    } catch (_error) {
      safeSetState(() => {
        setError(_error instanceof Error ? _error.message : 'エラーが発生しました');
        setIsDeleting(false);
      });
    }
  };

  const handleEditClick = useCallback(() => {
    if (mountedRef.current && !isDeleting && !isNavigating) {
      try {
        router.push(`/board/${id}/edit`);
      } catch (navError) {
        console.error('Navigation error:', navError);
        // フォールバック: 手動でページをリロード
        window.location.href = `/board/${id}/edit`;
      }
    }
  }, [router, id, isDeleting, isNavigating]);

  const handleDeleteClick = useCallback(() => {
    if (mountedRef.current && !isDeleting && !isNavigating) {
      safeSetState(() => {
        setDeleteDialogOpen(true);
      });
    }
  }, [isDeleting, isNavigating, safeSetState]);

  const handleDialogClose = useCallback(() => {
    if (mountedRef.current) {
      safeSetState(() => {
        setDeleteDialogOpen(false);
      });
    }
  }, [safeSetState]);

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

  if (!post) {
    return null;
  }

  const isAuthor = (session?.user as any)?.id === post.author._id;

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
              onClick={handleEditClick}
              disabled={isDeleting || isNavigating}
              sx={{ mr: 1 }}
            >
              編集
            </Button>
            <Button
              startIcon={<DeleteIcon />}
              color="error"
              onClick={handleDeleteClick}
              disabled={isDeleting || isNavigating}
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
        onClose={handleDialogClose}
      >
        <DialogTitle>投稿を削除しますか？</DialogTitle>
        <DialogContent>
          <Typography>
            この操作は取り消すことができません。本当に削除してもよろしいですか？
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDialogClose} disabled={isDeleting}>
            キャンセル
          </Button>
          <Button 
            onClick={handleDelete} 
            color="error" 
            variant="contained"
            disabled={isDeleting}
          >
            {isDeleting ? <CircularProgress size={20} /> : '削除'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}