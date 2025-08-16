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
  Alert,
  Pagination,
  Card,
  CardContent,
  CardActions,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Fab,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
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

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export default function BoardPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [posts, setPosts] = useState<Post[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [postToDelete, setPostToDelete] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    }
  }, [status, router]);

  useEffect(() => {
    if (status === 'authenticated') {
      fetchPosts();
    }
  }, [status, pagination.page]);

  const fetchPosts = async () => {
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch(`/api/posts?page=${pagination.page}&limit=${pagination.limit}`);
      
      if (!response.ok) {
        throw new Error('投稿の取得に失敗しました');
      }

      const data = await response.json();
      setPosts(data.posts);
      setPagination(data.pagination);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'エラーが発生しました');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!postToDelete) return;

    try {
      const response = await fetch(`/api/posts/${postToDelete}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('投稿の削除に失敗しました');
      }

      // 投稿一覧を再取得
      fetchPosts();
      setDeleteDialogOpen(false);
      setPostToDelete(null);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'エラーが発生しました');
    }
  };

  const handlePageChange = (event: React.ChangeEvent<unknown>, value: number) => {
    setPagination({ ...pagination, page: value });
  };

  if (status === 'loading' || isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" component="h1">
          掲示板
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => router.push('/board/new')}
        >
          新規投稿
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {posts.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="body1" color="text.secondary">
            まだ投稿がありません
          </Typography>
        </Paper>
      ) : (
        <>
          {posts.map((post) => (
            <Card key={post._id} sx={{ mb: 2 }}>
              <CardContent>
                <Typography variant="h6" component="h2" gutterBottom>
                  {post.title}
                </Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  投稿者: {post.authorName} | 
                  {format(new Date(post.createdAt), 'yyyy年MM月dd日 HH:mm', { locale: ja })}
                </Typography>
                <Typography variant="body1" sx={{ mt: 2, whiteSpace: 'pre-wrap' }}>
                  {post.content.length > 200 
                    ? `${post.content.substring(0, 200)}...` 
                    : post.content
                  }
                </Typography>
              </CardContent>
              <CardActions sx={{ justifyContent: 'space-between' }}>
                <Button size="small" onClick={() => router.push(`/board/${post._id}`)}>
                  詳細を見る
                </Button>
                {session?.user?.id === post.author._id && (
                  <Box>
                    <IconButton
                      size="small"
                      onClick={() => router.push(`/board/${post._id}/edit`)}
                      aria-label="編集"
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => {
                        setPostToDelete(post._id);
                        setDeleteDialogOpen(true);
                      }}
                      aria-label="削除"
                      color="error"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                )}
              </CardActions>
            </Card>
          ))}

          {pagination.totalPages > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
              <Pagination
                count={pagination.totalPages}
                page={pagination.page}
                onChange={handlePageChange}
                color="primary"
              />
            </Box>
          )}
        </>
      )}

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