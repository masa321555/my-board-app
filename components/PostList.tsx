'use client';

import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  IconButton,
  Divider,
} from '@mui/material';
import { Edit, Delete } from '@mui/icons-material';

interface Post {
  _id: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

interface PostListProps {
  posts: Post[];
  onEdit: (post: Post) => void;
  onDelete: (id: string) => void;
}

export default function PostList({ posts, onEdit, onDelete }: PostListProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (posts.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Typography variant="body1" color="text.secondary">
          まだ投稿がありません
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ mt: 3 }}>
      {posts.map((post, index) => (
        <Box key={post._id} sx={{ mb: 2 }}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Typography variant="body1" sx={{ flex: 1, mr: 2, whiteSpace: 'pre-wrap' }}>
                  {post.content}
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <Box sx={{ display: 'flex', gap: 0.5 }}>
                    <IconButton
                      size="small"
                      onClick={() => onEdit(post)}
                      color="primary"
                    >
                      <Edit fontSize="small" />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => onDelete(post._id)}
                      color="error"
                    >
                      <Delete fontSize="small" />
                    </IconButton>
                  </Box>
                </Box>
              </Box>
              <Box sx={{ mt: 2 }}>
                <Typography variant="caption" color="text.secondary">
                  投稿日時: {formatDate(post.createdAt)}
                  {post.createdAt !== post.updatedAt && (
                    <> • 更新日時: {formatDate(post.updatedAt)}</>
                  )}
                </Typography>
              </Box>
            </CardContent>
          </Card>
          {index < posts.length - 1 && <Divider sx={{ my: 1 }} />}
        </Box>
      ))}
    </Box>
  );
}