'use client';

import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
} from '@mui/material';
import PostForm from './PostForm';
import PostList from './PostList';

interface Post {
  _id: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export default function BoardApp() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [postToDelete, setPostToDelete] = useState<string | null>(null);

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/posts');
      
      if (!response.ok) {
        throw new Error('投稿の取得に失敗しました');
      }
      
      const data = await response.json();
      setPosts(data);
      setError('');
    } catch {
      setError('投稿の取得に失敗しました。ページを再読み込みしてください。');
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePost = async (content: string) => {
    try {
      const response = await fetch('/api/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '投稿の作成に失敗しました');
      }

      await fetchPosts();
    } catch (error) {
      throw error;
    }
  };

  const handleEditPost = async (content: string) => {
    if (!editingPost) return;

    try {
      const response = await fetch(`/api/posts/${editingPost._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '投稿の更新に失敗しました');
      }

      setEditingPost(null);
      await fetchPosts();
    } catch (error) {
      throw error;
    }
  };

  const handleDeletePost = async () => {
    if (!postToDelete) return;

    try {
      const response = await fetch(`/api/posts/${postToDelete}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '投稿の削除に失敗しました');
      }

      setDeleteDialogOpen(false);
      setPostToDelete(null);
      await fetchPosts();
    } catch {
      setError('投稿の削除に失敗しました');
      setDeleteDialogOpen(false);
      setPostToDelete(null);
    }
  };

  const openDeleteDialog = (postId: string) => {
    setPostToDelete(postId);
    setDeleteDialogOpen(true);
  };

  const closeDeleteDialog = () => {
    setDeleteDialogOpen(false);
    setPostToDelete(null);
  };

  const handleEditClick = (post: Post) => {
    setEditingPost(post);
  };

  const handleCancelEdit = () => {
    setEditingPost(null);
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="h3" component="h1" gutterBottom align="center" sx={{ mb: 4 }}>
        掲示板
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <PostForm
        editingPost={editingPost}
        onSubmit={editingPost ? handleEditPost : handleCreatePost}
        onCancel={editingPost ? handleCancelEdit : undefined}
      />

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <PostList
          posts={posts}
          onEdit={handleEditClick}
          onDelete={openDeleteDialog}
        />
      )}

      <Dialog open={deleteDialogOpen} onClose={closeDeleteDialog}>
        <DialogTitle>投稿の削除</DialogTitle>
        <DialogContent>
          この投稿を削除してもよろしいですか？この操作は取り消せません。
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDeleteDialog}>キャンセル</Button>
          <Button onClick={handleDeletePost} color="error" variant="contained">
            削除
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}