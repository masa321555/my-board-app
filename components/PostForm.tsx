'use client';

import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Box,
  Alert,
} from '@mui/material';

interface Post {
  _id: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

interface PostFormProps {
  editingPost?: Post | null;
  onSubmit: (content: string) => Promise<void>;
  onCancel?: () => void;
}

export default function PostForm({ editingPost, onSubmit, onCancel }: PostFormProps) {
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (editingPost) {
      setContent(editingPost.content);
    } else {
      setContent('');
    }
    setError('');
  }, [editingPost]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!content.trim()) {
      setError('投稿内容を入力してください');
      return;
    }

    if (content.length > 200) {
      setError('投稿は200文字以内で入力してください');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      await onSubmit(content);
      if (!editingPost) {
        setContent('');
      }
    } catch {
      setError('投稿に失敗しました。もう一度お試しください。');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setContent('');
    setError('');
    if (onCancel) {
      onCancel();
    }
  };

  const remainingChars = 200 - content.length;
  const isOverLimit = remainingChars < 0;

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          {editingPost ? '投稿を編集' : '新しい投稿を作成'}
        </Typography>
        
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <Box sx={{ mb: 2 }}>
            <TextField
              multiline
              rows={4}
              fullWidth
              placeholder="何を投稿しますか？（200文字以内）"
              value={content}
              onChange={(e) => {
                // 200文字を超える入力を防ぐ
                if (e.target.value.length <= 200) {
                  setContent(e.target.value);
                }
              }}
              error={isOverLimit}
              sx={{ mb: 0.5 }}
              inputProps={{ maxLength: 200 }}
            />
            <Box sx={{ display: 'flex', justifyContent: 'space-between', px: 1.75, mt: 0.5 }}>
              <Typography variant="caption" color={isOverLimit ? 'error' : 'text.secondary'}>
                {isOverLimit ? '文字数が上限を超えています' : ''}
              </Typography>
              <Typography variant="caption" color={isOverLimit ? 'error' : 'text.secondary'}>
                {content.length}/200文字
              </Typography>
            </Box>
          </Box>
          
          <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
            {editingPost && (
              <Button
                variant="outlined"
                onClick={handleCancel}
                disabled={isSubmitting}
              >
                キャンセル
              </Button>
            )}
            <Button
              type="submit"
              variant="contained"
              disabled={isSubmitting || !content.trim() || isOverLimit}
            >
              {isSubmitting ? '投稿中...' : editingPost ? '更新' : '投稿'}
            </Button>
          </Box>
        </form>
      </CardContent>
    </Card>
  );
}