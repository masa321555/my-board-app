'use client';

import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
  Container,
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  Avatar,
  Divider,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
  LinearProgress,
} from '@mui/material';
import {
  Person as PersonIcon,
  Email as EmailIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Delete as DeleteIcon,
  PhotoCamera as PhotoCameraIcon,
} from '@mui/icons-material';
import ProtectedLayout from '@/components/ProtectedLayout';

export default function ProfilePage() {
  const { data: session, update, status } = useSession();
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    bio: '',
    location: '',
    website: '',
  });
  
  // APIから取得したオリジナルのデータを保持
  const [originalData, setOriginalData] = useState({
    name: '',
    email: '',
    bio: '',
    location: '',
    website: '',
  });

  // プロフィール情報を取得
  useEffect(() => {
    // ページロード時にメッセージをクリア
    setMessage(null);
    
    const fetchProfile = async () => {
      setIsLoading(true);
      try {
        const response = await fetch('/api/user/profile', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'same-origin',
        });
        
        if (response.ok) {
          const data = await response.json();
          
          const profileData = {
            name: data.name || '',
            email: data.email || '',
            bio: data.bio || '',
            location: data.location || '',
            website: data.website || '',
          };
          
          setFormData(profileData);
          setOriginalData(profileData);
          setAvatarUrl(data.avatar || null);
        } else if (response.status === 401) {
          // 認証エラーの場合、サインインページへ
          router.push('/auth/signin');
        } else {
          const errorData = await response.json().catch(() => ({}));
          setMessage({
            type: 'error',
            text: errorData.error || 'プロフィールの取得に失敗しました'
          });
        }
      } catch (error) {
        console.error('Failed to fetch profile:', error);
        setMessage({
          type: 'error',
          text: 'プロフィールの取得に失敗しました'
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    // セッションが読み込み中でない場合
    if (status !== 'loading') {
      if (status === 'authenticated' && session?.user) {
        fetchProfile();
      } else {
        setIsLoading(false);
      }
    }
  }, [session, status, router]);

  const handleEdit = () => {
    setIsEditing(true);
    setMessage(null);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setFormData(originalData);
    setMessage(null);
  };

  const handleSave = async () => {
    setIsSaving(true);
    setMessage(null);

    try {
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'same-origin',
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'プロフィールの更新に失敗しました');
      }

      // セッションを更新
      await update({
        ...session,
        user: {
          ...session?.user,
          name: formData.name,
        },
      });

      // 保存成功時にoriginalDataも更新
      setOriginalData(formData);
      setMessage({ type: 'success', text: 'プロフィールを更新しました' });
      setIsEditing(false);
      
      // ページをリフレッシュして、ヘッダーの名前表示を更新
      router.refresh();
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error instanceof Error ? error.message : 'エラーが発生しました' 
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteAccount = () => {
    setDeleteDialogOpen(true);
  };

  const confirmDeleteAccount = () => {
    router.push('/account/delete');
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const handleAvatarClick = () => {
    console.log('Avatar clicked, fileInputRef:', fileInputRef.current);
    fileInputRef.current?.click();
  };

  const handleAvatarChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    console.log('File input changed:', event.target.files);
    const file = event.target.files?.[0];
    if (!file) {
      console.log('No file selected');
      return;
    }

    console.log('Selected file:', file.name, file.size, file.type);

    // ファイルサイズチェック（クライアント側）
    if (file.size > 5 * 1024 * 1024) {
      setMessage({
        type: 'error',
        text: 'ファイルサイズは5MB以下にしてください',
      });
      return;
    }

    // ファイルタイプチェック（クライアント側）
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setMessage({
        type: 'error',
        text: '画像ファイル（JPEG、PNG、WebP）のみアップロードできます',
      });
      return;
    }

    setIsUploadingAvatar(true);
    setMessage(null);
    setUploadProgress(0);

    const formData = new FormData();
    formData.append('avatar', file);

    try {
      console.log('Uploading file to /api/user/avatar');
      
      // XMLHttpRequestを使用してアップロード進捗を追跡
      const xhr = new XMLHttpRequest();
      
      const uploadPromise = new Promise<{ ok: boolean; data: any }>((resolve, reject) => {
        xhr.upload.addEventListener('progress', (e) => {
          if (e.lengthComputable) {
            const progress = Math.round((e.loaded / e.total) * 100);
            setUploadProgress(progress);
            console.log('Upload progress:', progress);
          }
        });

        xhr.addEventListener('load', () => {
          console.log('Upload completed, status:', xhr.status);
          console.log('Response:', xhr.responseText);
          try {
            const data = JSON.parse(xhr.responseText);
            if (xhr.status >= 200 && xhr.status < 300) {
              resolve({ ok: true, data });
            } else {
              resolve({ ok: false, data });
            }
          } catch (_error) {
            reject(new Error('レスポンスの解析に失敗しました'));
          }
        });

        xhr.addEventListener('error', (error) => {
          console.error('Upload error:', error);
          reject(new Error('ネットワークエラーが発生しました'));
        });

        xhr.open('POST', '/api/user/avatar');
        xhr.send(formData);
      });

      const result = await uploadPromise;

      if (!result.ok) {
        throw new Error(result.data.error || 'アバターのアップロードに失敗しました');
      }

      console.log('Upload successful:', result.data);
      setAvatarUrl(result.data.avatarUrl);
      setMessage({ type: 'success', text: 'アバター画像をアップロードしました' });
    } catch (error) {
      console.error('Upload failed:', error);
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'エラーが発生しました',
      });
    } finally {
      setIsUploadingAvatar(false);
      setUploadProgress(0);
      // ファイル入力をリセット
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDeleteAvatar = async () => {
    setIsUploadingAvatar(true);
    setMessage(null);

    try {
      const response = await fetch('/api/user/avatar', {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'アバターの削除に失敗しました');
      }

      setAvatarUrl(null);
      setMessage({ type: 'success', text: 'アバター画像を削除しました' });
    } catch (error) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'エラーが発生しました',
      });
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  // ローディング中の表示
  if (isLoading || status === 'loading') {
    return (
      <ProtectedLayout>
        <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
          <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
            <CircularProgress />
          </Box>
        </Container>
      </ProtectedLayout>
    );
  }

  return (
    <ProtectedLayout>
      <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
        <Paper sx={{ p: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
            <PersonIcon sx={{ mr: 1, fontSize: 32 }} />
            <Typography variant="h4" component="h1">
              プロフィール
            </Typography>
          </Box>

          {message && (
            <Alert severity={message.type} sx={{ mb: 3 }} onClose={() => setMessage(null)}>
              {message.text}
            </Alert>
          )}

          {/* アップロード進捗バー */}
          {isUploadingAvatar && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                アップロード中... {uploadProgress}%
              </Typography>
              <LinearProgress variant="determinate" value={uploadProgress} />
            </Box>
          )}

          <Box 
            sx={{ 
              display: 'grid',
              gridTemplateColumns: {
                xs: '1fr',
                md: '1fr 2fr'
              },
              gap: 4
            }}
          >
            {/* 左側：アバターとアクション */}
            <Box>
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <Avatar
                  src={avatarUrl || undefined}
                  sx={{
                    width: 150,
                    height: 150,
                    fontSize: 48,
                    bgcolor: 'primary.main',
                    mb: 2,
                    cursor: 'pointer',
                  }}
                  onClick={handleAvatarClick}
                >
                  {!avatarUrl && (formData.name || session?.user?.name ? getInitials(formData.name || session?.user?.name || '') : <PersonIcon />)}
                </Avatar>
                
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/webp"
                  style={{ display: 'none' }}
                  onChange={handleAvatarChange}
                />
                
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button
                    variant="outlined"
                    startIcon={<PhotoCameraIcon />}
                    size="small"
                    onClick={handleAvatarClick}
                    disabled={isUploadingAvatar}
                  >
                    {isUploadingAvatar ? `アップロード中 ${uploadProgress}%` : '写真を変更'}
                  </Button>
                  {avatarUrl && (
                    <Button
                      variant="outlined"
                      color="error"
                      size="small"
                      onClick={handleDeleteAvatar}
                      disabled={isUploadingAvatar}
                    >
                      削除
                    </Button>
                  )}
                </Box>

                <Typography variant="h6" sx={{ mt: 2 }}>
                  {formData.name || session?.user?.name}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {formData.email || session?.user?.email}
                </Typography>
              </Box>
            </Box>

            {/* 右側：プロフィール情報 */}
            <Box>
              <Box sx={{ mb: 3 }}>
                <TextField
                  fullWidth
                  label="名前"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  disabled={!isEditing}
                  margin="normal"
                  InputProps={{
                    startAdornment: <PersonIcon sx={{ mr: 1, color: 'text.secondary' }} />,
                  }}
                />

                <TextField
                  fullWidth
                  label="メールアドレス"
                  value={formData.email}
                  disabled
                  margin="normal"
                  helperText="メールアドレスは変更できません"
                  InputProps={{
                    startAdornment: <EmailIcon sx={{ mr: 1, color: 'text.secondary' }} />,
                  }}
                />

                <TextField
                  fullWidth
                  label="自己紹介"
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  disabled={!isEditing}
                  margin="normal"
                  multiline
                  rows={3}
                  placeholder="自己紹介を入力してください"
                  helperText={`${formData.bio.length}/200文字`}
                  error={formData.bio.length > 200}
                />

                <TextField
                  fullWidth
                  label="居住地"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  disabled={!isEditing}
                  margin="normal"
                  placeholder="例: 東京都"
                />

                <TextField
                  fullWidth
                  label="ウェブサイト"
                  value={formData.website}
                  onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                  disabled={!isEditing}
                  margin="normal"
                  placeholder="https://example.com"
                />
              </Box>

              <Divider sx={{ my: 3 }} />

              {/* アクションボタン */}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  {!isEditing ? (
                    <Button
                      variant="contained"
                      startIcon={<EditIcon />}
                      onClick={handleEdit}
                    >
                      編集
                    </Button>
                  ) : (
                    <>
                      <Button
                        variant="contained"
                        startIcon={<SaveIcon />}
                        onClick={handleSave}
                        disabled={isSaving}
                        sx={{ mr: 2 }}
                      >
                        {isSaving ? <CircularProgress size={20} /> : '保存'}
                      </Button>
                      <Button
                        variant="outlined"
                        startIcon={<CancelIcon />}
                        onClick={handleCancel}
                        disabled={isSaving}
                      >
                        キャンセル
                      </Button>
                    </>
                  )}
                </Box>

                <Button
                  variant="text"
                  color="error"
                  startIcon={<DeleteIcon />}
                  onClick={handleDeleteAccount}
                >
                  アカウント削除
                </Button>
              </Box>
            </Box>
          </Box>
        </Paper>

        {/* アカウント削除確認ダイアログ */}
        <Dialog
          open={deleteDialogOpen}
          onClose={() => setDeleteDialogOpen(false)}
        >
          <DialogTitle>アカウント削除の確認</DialogTitle>
          <DialogContent>
            <DialogContentText>
              本当にアカウントを削除しますか？
              この操作は取り消すことができません。
              すべての投稿とデータが完全に削除されます。
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDeleteDialogOpen(false)}>
              キャンセル
            </Button>
            <Button onClick={confirmDeleteAccount} color="error" variant="contained">
              削除手続きへ進む
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </ProtectedLayout>
  );
}