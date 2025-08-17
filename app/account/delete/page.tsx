'use client';

import { useState } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
  Container,
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  Alert,
  Stepper,
  Step,
  StepLabel,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
} from '@mui/material';
import {
  Warning as WarningIcon,
  Delete as DeleteIcon,
  Check as CheckIcon,
} from '@mui/icons-material';
import ProtectedLayout from '@/components/ProtectedLayout';

const steps = ['注意事項の確認', 'パスワードの確認', '最終確認'];

export default function DeleteAccountPage() {
  const { data: _session } = useSession();
  const router = useRouter();
  const [activeStep, setActiveStep] = useState(0);
  const [password, setPassword] = useState('');
  const [confirmText, setConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState('');
  const [successDialogOpen, setSuccessDialogOpen] = useState(false);

  const handleNext = () => {
    setError('');
    if (activeStep === 1 && !password) {
      setError('パスワードを入力してください');
      return;
    }
    if (activeStep === 2 && confirmText !== 'DELETE') {
      setError('「DELETE」と入力してください');
      return;
    }
    setActiveStep((prevStep) => prevStep + 1);
  };

  const handleBack = () => {
    setError('');
    setActiveStep((prevStep) => prevStep - 1);
  };

  const handleCancel = () => {
    router.push('/profile');
  };

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    setError('');

    try {
      const response = await fetch('/api/account/delete', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'アカウント削除に失敗しました');
      }

      setSuccessDialogOpen(true);
      
      // 3秒後に自動的にログアウトしてホームページへ
      setTimeout(async () => {
        await signOut({ redirect: false });
        router.push('/');
      }, 3000);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'エラーが発生しました');
      setIsDeleting(false);
    }
  };

  const getStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <Box>
            <Alert severity="error" sx={{ mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                重要：アカウント削除について
              </Typography>
              <Typography variant="body2">
                アカウントを削除すると、以下のデータがすべて失われます：
              </Typography>
            </Alert>
            
            <List>
              <ListItem>
                <ListItemIcon>
                  <WarningIcon color="error" />
                </ListItemIcon>
                <ListItemText
                  primary="すべての投稿"
                  secondary="あなたが作成したすべての投稿が削除されます"
                />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <WarningIcon color="error" />
                </ListItemIcon>
                <ListItemText
                  primary="プロフィール情報"
                  secondary="名前、メールアドレス、その他のプロフィール情報"
                />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <WarningIcon color="error" />
                </ListItemIcon>
                <ListItemText
                  primary="コメントと活動履歴"
                  secondary="すべてのコメントと活動履歴が削除されます"
                />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <WarningIcon color="error" />
                </ListItemIcon>
                <ListItemText
                  primary="復元不可"
                  secondary="一度削除したアカウントは復元できません"
                />
              </ListItem>
            </List>

            <Alert severity="warning" sx={{ mt: 3 }}>
              この操作は取り消すことができません。本当に続行しますか？
            </Alert>
          </Box>
        );

      case 1:
        return (
          <Box>
            <Typography variant="body1" gutterBottom>
              本人確認のため、パスワードを入力してください。
            </Typography>
            <TextField
              fullWidth
              type="password"
              label="現在のパスワード"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              margin="normal"
              autoFocus
              error={!!error}
              helperText={error}
            />
          </Box>
        );

      case 2:
        return (
          <Box>
            <Alert severity="error" sx={{ mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                最終確認
              </Typography>
              <Typography variant="body2">
                本当にアカウントを削除してもよろしいですか？
                この操作は取り消すことができません。
              </Typography>
            </Alert>

            <Typography variant="body1" gutterBottom>
              アカウントを削除するには、下のフィールドに「DELETE」と入力してください。
            </Typography>
            
            <TextField
              fullWidth
              label="DELETEと入力"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              margin="normal"
              autoFocus
              error={!!error}
              helperText={error || '大文字で「DELETE」と入力してください'}
              placeholder="DELETE"
            />
          </Box>
        );

      default:
        return null;
    }
  };

  return (
    <ProtectedLayout>
      <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
        <Paper sx={{ p: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            <DeleteIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
            アカウント削除
          </Typography>

          <Stepper activeStep={activeStep} sx={{ my: 4 }}>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>

          <Box sx={{ mt: 4, mb: 4 }}>
            {getStepContent(activeStep)}
          </Box>

          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Button
              variant="outlined"
              onClick={handleCancel}
              disabled={isDeleting}
            >
              キャンセル
            </Button>
            
            <Box>
              {activeStep > 0 && (
                <Button
                  onClick={handleBack}
                  sx={{ mr: 2 }}
                  disabled={isDeleting}
                >
                  戻る
                </Button>
              )}
              
              {activeStep < steps.length - 1 ? (
                <Button
                  variant="contained"
                  onClick={handleNext}
                  disabled={isDeleting}
                >
                  次へ
                </Button>
              ) : (
                <Button
                  variant="contained"
                  color="error"
                  onClick={handleDeleteAccount}
                  disabled={isDeleting || confirmText !== 'DELETE'}
                  startIcon={isDeleting ? <CircularProgress size={20} /> : <DeleteIcon />}
                >
                  {isDeleting ? '削除中...' : 'アカウントを削除'}
                </Button>
              )}
            </Box>
          </Box>
        </Paper>

        {/* 削除成功ダイアログ */}
        <Dialog
          open={successDialogOpen}
          onClose={() => {}}
          disableEscapeKeyDown
        >
          <DialogTitle>
            <CheckIcon color="success" sx={{ mr: 1, verticalAlign: 'middle' }} />
            アカウントが削除されました
          </DialogTitle>
          <DialogContent>
            <Typography>
              アカウントの削除が完了しました。
              ご利用ありがとうございました。
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
              3秒後に自動的にホームページへ移動します...
            </Typography>
          </DialogContent>
        </Dialog>
      </Container>
    </ProtectedLayout>
  );
}