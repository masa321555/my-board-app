'use client';

import { useState } from 'react';
import {
  Container,
  Box,
  Button,
  Typography,
  Paper,
  Alert,
} from '@mui/material';
import Link from 'next/link';

export default function RegisterTestPage() {
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const testJsonSubmit = async () => {
    setLoading(true);
    setMessage('');
    setError('');

    try {
      const testData = {
        name: "テストユーザー",
        email: `test${Date.now()}@example.com`,
        password: "TestPassword123!",
        confirmPassword: "TestPassword123!"
      };

      console.log('送信データ:', testData);

      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testData),
      });

      const result = await response.json();
      console.log('レスポンス:', result);

      if (result.ok) {
        setMessage(`成功: ${result.message}`);
      } else {
        setError(`エラー: ${result.error} (${result.code})`);
        if (result.details) {
          console.log('エラー詳細:', result.details);
        }
      }
    } catch (err) {
      console.error('通信エラー:', err);
      setError('通信エラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  const testFormDataSubmit = async () => {
    setLoading(true);
    setMessage('');
    setError('');

    try {
      const formData = new FormData();
      formData.append('name', 'テストユーザー');
      formData.append('email', `test${Date.now()}@example.com`);
      formData.append('password', 'TestPassword123!');
      formData.append('confirmPassword', 'TestPassword123!');

      console.log('FormData送信');

      const response = await fetch('/api/auth/register-formdata', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();
      console.log('FormDataレスポンス:', result);

      if (result.ok) {
        setMessage(`成功: ${result.message}`);
      } else {
        setError(`エラー: ${result.error} (${result.code})`);
      }
    } catch (err) {
      console.error('FormData通信エラー:', err);
      setError('FormData通信エラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container component="main" maxWidth="sm">
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Paper elevation={3} sx={{ padding: 4, width: '100%' }}>
          <Typography component="h1" variant="h5" align="center" gutterBottom>
            登録機能テスト
          </Typography>
          
          {message && (
            <Alert severity="success" sx={{ mb: 2 }}>
              {message}
            </Alert>
          )}
          
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Button
              variant="contained"
              fullWidth
              onClick={testJsonSubmit}
              disabled={loading}
            >
              JSON形式でテスト送信
            </Button>

            <Button
              variant="contained"
              color="secondary"
              fullWidth
              onClick={testFormDataSubmit}
              disabled={loading}
            >
              FormData形式でテスト送信
            </Button>

            <Typography variant="body2" sx={{ mt: 2 }}>
              * ブラウザのコンソールで詳細を確認してください
            </Typography>

            <Box sx={{ textAlign: 'center', mt: 2 }}>
              <Link href="/auth/register" style={{ textDecoration: 'none' }}>
                <Typography color="primary">
                  通常の登録ページに戻る
                </Typography>
              </Link>
            </Box>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
}