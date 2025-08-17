'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import {
  Container,
  Box,
  Paper,
  Typography,
  Button,
  CircularProgress,
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
import RefreshIcon from '@mui/icons-material/Refresh';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import StableAlert from '@/components/StableAlert';

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

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export default function BoardPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();
  const [posts, setPosts] = useState<Post[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [postToDelete, setPostToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const mountedRef = useRef(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const refreshTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const currentPageRef = useRef(1);
  const currentLimitRef = useRef(10);
  // 動的キー生成（より安定したキー）- Hooksの順序を保つためここに配置
  const dynamicKey = useRef(Date.now()).current;

  // マウント状態の管理
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      // クリーンアップ: リクエストをキャンセル
      if (abortControllerRef.current) {
        try {
          abortControllerRef.current.abort();
        } catch (error) {
          // AbortErrorは無視
        }
      }
      // クリーンアップ: タイムアウトをクリア
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
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

  // URLパラメータからページ番号を取得
  useEffect(() => {
    const pageParam = searchParams.get('page');
    const page = pageParam ? parseInt(pageParam, 10) : 1;
    currentPageRef.current = page;
    safeSetState(() => {
      setPagination(prev => ({ ...prev, page }));
    });
  }, [searchParams, safeSetState]);

  // 投稿取得関数（メモ化しない）
  const fetchPosts = async (forceRefresh = false) => {
    if (!mountedRef.current) return;
    
    // 前のリクエストをキャンセル
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    // 新しいAbortControllerを作成
    abortControllerRef.current = new AbortController();
    
    safeSetState(() => {
      setLoading(true);
      setError('');
      if (forceRefresh) {
        setIsRefreshing(true);
      }
    });

    try {
      const response = await fetch(
        `/api/posts?page=${currentPageRef.current}&limit=${currentLimitRef.current}`,
        { signal: abortControllerRef.current.signal }
      );
      
      if (!response.ok) {
        throw new Error('投稿の取得に失敗しました');
      }

      const data = await response.json();
      safeSetState(() => {
        setPosts(data.posts);
        setPagination(data.pagination);
      });
    } catch (error: any) {
      // AbortErrorの場合は無視
      if (error?.name === 'AbortError' || error?.code === 'ABORT_ERR') {
        console.log('投稿取得リクエストがキャンセルされました');
        return;
      }
      // その他のエラーの場合のみ表示
      if (mountedRef.current) {
        safeSetState(() => {
          setError(error instanceof Error ? error.message : 'エラーが発生しました');
        });
      }
    } finally {
      safeSetState(() => {
        setLoading(false);
        setIsRefreshing(false);
      });
    }
  };

  // 認証済みの場合に投稿を取得
  useEffect(() => {
    if (status === 'authenticated' && currentPageRef.current > 0) {
      fetchPosts();
    }
  }, [status, pagination.page]); // ページ変更時にも再取得

  const handlePageChange = useCallback((event: React.ChangeEvent<unknown>, value: number) => {
    currentPageRef.current = value;
    safeSetState(() => {
      setPagination(prev => ({ ...prev, page: value }));
    });
  }, [safeSetState]);

  const handleNavigation = useCallback((path: string) => {
    if (mountedRef.current && !isNavigating) {
      safeSetState(() => {
        setIsNavigating(true);
      });
      
      setTimeout(() => {
        if (mountedRef.current) {
          try {
            router.push(path);
          } catch (navError) {
            console.error('Navigation error:', navError);
            // フォールバック: 手動でページをリロード
            window.location.href = path;
          }
        }
      }, 1000);
    }
  }, [isNavigating, safeSetState, router]);

  const handleDeleteCancel = useCallback(() => {
    if (mountedRef.current && !isDeleting) {
      safeSetState(() => {
        setDeleteDialogOpen(false);
        setPostToDelete(null);
        setError(''); // エラーメッセージもクリア
      });
    }
  }, [isDeleting, safeSetState]);

  const handleDeleteClick = useCallback((postId: string) => {
    if (mountedRef.current && !isDeleting) {
      safeSetState(() => {
        setPostToDelete(postId);
        setDeleteDialogOpen(true);
        setError(''); // エラーメッセージをクリア
      });
    }
  }, [isDeleting, safeSetState]);

  const handleDeleteConfirm = useCallback(async () => {
    if (!postToDelete || !mountedRef.current || isDeleting) return;

    safeSetState(() => {
      setIsDeleting(true);
      setError(''); // エラーメッセージをクリア
    });

    try {
      const response = await fetch(`/api/posts/${postToDelete}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: '削除に失敗しました' }));
        throw new Error(errorData.error || '投稿の削除に失敗しました');
      }

      // 削除成功後、投稿一覧を再取得
      safeSetState(() => {
        // ダイアログを閉じる
        setDeleteDialogOpen(false);
        setPostToDelete(null);
      });
      
      // 少し遅延を入れてから投稿一覧を再取得
      refreshTimeoutRef.current = setTimeout(() => {
        if (mountedRef.current) {
          fetchPosts(true);
        }
      }, 500);
    } catch (error) {
      console.error('削除エラー:', error);
      safeSetState(() => {
        setError(error instanceof Error ? error.message : 'エラーが発生しました');
      });
    } finally {
      safeSetState(() => {
        setIsDeleting(false);
      });
    }
  }, [postToDelete, isDeleting, safeSetState]);

  const handleRefresh = useCallback(() => {
    if (mountedRef.current && !loading) {
      fetchPosts(true);
    }
  }, [loading]);

  const handleNewPostClick = useCallback(() => {
    if (mountedRef.current && !isNavigating) {
      safeSetState(() => {
        setIsNavigating(true);
      });
      
      setTimeout(() => {
        if (mountedRef.current) {
          try {
            router.push('/board/new');
          } catch (navError) {
            console.error('Navigation error:', navError);
            // フォールバック: 手動でページをリロード
            window.location.href = '/board/new';
          }
        }
      }, 1000);
    }
  }, [isNavigating, safeSetState, router]);

  const handleViewPostClick = useCallback((postId: string) => {
    if (mountedRef.current && !isNavigating) {
      safeSetState(() => {
        setIsNavigating(true);
      });
      
      setTimeout(() => {
        if (mountedRef.current) {
          try {
            router.push(`/board/${postId}`);
          } catch (navError) {
            console.error('Navigation error:', navError);
            // フォールバック: 手動でページをリロード
            window.location.href = `/board/${postId}`;
          }
        }
      }, 1000);
    }
  }, [isNavigating, safeSetState, router]);

  const handleEditPostClick = useCallback((postId: string) => {
    if (mountedRef.current && !isNavigating) {
      safeSetState(() => {
        setIsNavigating(true);
      });
      
      setTimeout(() => {
        if (mountedRef.current) {
          try {
            router.push(`/board/${postId}/edit`);
          } catch (navError) {
            console.error('Navigation error:', navError);
            // フォールバック: 手動でページをリロード
            window.location.href = `/board/${postId}/edit`;
          }
        }
      }, 1000);
    }
  }, [isNavigating, safeSetState, router]);

  // マウント前はローディング表示
  if (status === 'loading' || loading) {
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
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={handleRefresh}
            disabled={loading || isNavigating}
          >
            更新
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleNewPostClick}
            disabled={isNavigating}
          >
            新規投稿
          </Button>
        </Box>
      </Box>

      <StableAlert
        open={!!error}
        severity="error"
        onClose={() => setError('')}
      >
        {error}
      </StableAlert>

      {posts.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="body1" color="text.secondary">
            まだ投稿がありません
          </Typography>
        </Paper>
      ) : (
        <Box>
          {posts.map((post) => (
            <Card key={`post-${post._id}-${dynamicKey}`} sx={{ mb: 2 }}>
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
                <Button 
                  size="small" 
                  onClick={() => handleViewPostClick(post._id)}
                  disabled={isNavigating}
                >
                  詳細を見る
                </Button>
                {session?.user?.id === post.author._id && (
                  <Box>
                    <IconButton
                      size="small"
                      onClick={() => handleEditPostClick(post._id)}
                      aria-label="編集"
                      disabled={isNavigating}
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleDeleteClick(post._id)}
                      aria-label="削除"
                      color="error"
                      disabled={isDeleting || isNavigating}
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
                disabled={isNavigating}
              />
            </Box>
          )}
        </Box>
      )}

      <Dialog
        open={deleteDialogOpen}
        onClose={handleDeleteCancel}
        disableEscapeKeyDown={isDeleting}
        slotProps={{
          backdrop: {
            onClick: isDeleting ? undefined : handleDeleteCancel
          }
        }}
        keepMounted={false}
      >
        <DialogTitle>投稿を削除しますか？</DialogTitle>
        <DialogContent>
          <Typography>
            この操作は取り消すことができません。本当に削除してもよろしいですか？
          </Typography>
          <StableAlert
            open={!!error}
            severity="error"
            onClose={() => setError('')}
          >
            {error}
          </StableAlert>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel} disabled={isDeleting}>
            キャンセル
          </Button>
          <Button 
            onClick={handleDeleteConfirm} 
            color="error" 
            variant="contained"
            disabled={isDeleting}
            startIcon={isDeleting ? <CircularProgress size={20} /> : null}
          >
            {isDeleting ? '削除中...' : '削除'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}