'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
  Container,
  Box,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  CardActions,
  Paper,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  Article as ArticleIcon,
  Person as PersonIcon,
  Login as LoginIcon,
  PersonAdd as PersonAddIcon,
  Security as SecurityIcon,
  Forum as ForumIcon,
  Create as CreateIcon,
} from '@mui/icons-material';

export default function HomePage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const features = [
    {
      icon: <SecurityIcon sx={{ fontSize: 48 }} />,
      title: '安全な認証',
      description: 'メール認証とパスワードハッシュ化により、安全なアカウント管理を実現',
    },
    {
      icon: <ForumIcon sx={{ fontSize: 48 }} />,
      title: '会員限定掲示板',
      description: '会員だけが閲覧・投稿できる専用の掲示板システム',
    },
    {
      icon: <CreateIcon sx={{ fontSize: 48 }} />,
      title: 'リッチなエディタ',
      description: 'Markdownサポートで、見やすく整形された投稿が可能',
    },
  ];

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* ヒーローセクション */}
      <Paper
        sx={{
          p: 6,
          mb: 4,
          background: 'linear-gradient(45deg, #1976d2 30%, #42a5f5 90%)',
          color: 'white',
          textAlign: 'center',
        }}
      >
        <Typography variant="h2" component="h1" gutterBottom>
          会員制掲示板システム
        </Typography>
        <Typography variant="h5" sx={{ mb: 4 }}>
          安全で使いやすい、プライベートなコミュニティプラットフォーム
        </Typography>
        
        {status === 'authenticated' ? (
          <Box>
            <Typography variant="h6" sx={{ mb: 3 }}>
              おかえりなさい、{session?.user?.name}さん！
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Button
                variant="contained"
                size="large"
                color="secondary"
                startIcon={<DashboardIcon />}
                onClick={() => router.push('/dashboard')}
              >
                ダッシュボードへ
              </Button>
              <Button
                variant="outlined"
                size="large"
                sx={{ 
                  color: 'white', 
                  borderColor: 'white',
                  '&:hover': {
                    borderColor: 'white',
                    backgroundColor: 'rgba(255,255,255,0.1)',
                  }
                }}
                startIcon={<ArticleIcon />}
                onClick={() => router.push('/board')}
              >
                掲示板を見る
              </Button>
            </Box>
          </Box>
        ) : (
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Button
              variant="contained"
              size="large"
              color="secondary"
              startIcon={<PersonAddIcon />}
              onClick={() => router.push('/auth/register')}
            >
              新規登録
            </Button>
            <Button
              variant="outlined"
              size="large"
              sx={{ 
                color: 'white', 
                borderColor: 'white',
                '&:hover': {
                  borderColor: 'white',
                  backgroundColor: 'rgba(255,255,255,0.1)',
                }
              }}
              startIcon={<LoginIcon />}
              onClick={() => router.push('/auth/signin')}
            >
              ログイン
            </Button>
          </Box>
        )}
      </Paper>

      {/* 機能紹介 */}
      <Typography variant="h4" component="h2" gutterBottom sx={{ mb: 4, textAlign: 'center' }}>
        主な機能
      </Typography>
      
      <Box sx={{ 
        display: 'flex', 
        gap: 3, 
        mb: 6, 
        flexWrap: { xs: 'wrap', md: 'nowrap' },
        justifyContent: 'center'
      }}>
        {features.map((feature, index) => (
          <Card 
            key={index} 
            sx={{ 
              flex: { xs: '1 1 100%', md: '1 1 0' },
              minWidth: { xs: '100%', md: '300px' },
              maxWidth: { xs: '100%', md: '400px' },
              textAlign: 'center',
              height: 'fit-content'
            }}
          >
            <CardContent>
              <Box sx={{ color: 'primary.main', mb: 2 }}>
                {feature.icon}
              </Box>
              <Typography variant="h5" component="h3" gutterBottom>
                {feature.title}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {feature.description}
              </Typography>
            </CardContent>
          </Card>
        ))}
      </Box>

      {/* 会員向けクイックリンク */}
      {status === 'authenticated' && (
        <Paper sx={{ p: 4 }}>
          <Typography variant="h5" component="h3" gutterBottom>
            クイックアクセス
          </Typography>
          <Grid container spacing={2} sx={{ mt: 2 }}>
            <Grid xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <DashboardIcon sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
                  <Typography variant="h6">
                    ダッシュボード
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    統計情報と最新の活動
                  </Typography>
                </CardContent>
                <CardActions>
                  <Button
                    size="small"
                    onClick={() => router.push('/dashboard')}
                  >
                    アクセス
                  </Button>
                </CardActions>
              </Card>
            </Grid>
            
            <Grid xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <PersonIcon sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
                  <Typography variant="h6">
                    プロフィール
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    アカウント情報の管理
                  </Typography>
                </CardContent>
                <CardActions>
                  <Button
                    size="small"
                    onClick={() => router.push('/profile')}
                  >
                    アクセス
                  </Button>
                </CardActions>
              </Card>
            </Grid>
            
            <Grid xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <ArticleIcon sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
                  <Typography variant="h6">
                    掲示板
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    投稿の閲覧と作成
                  </Typography>
                </CardContent>
                <CardActions>
                  <Button
                    size="small"
                    onClick={() => router.push('/board')}
                  >
                    アクセス
                  </Button>
                </CardActions>
              </Card>
            </Grid>
            
            <Grid xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <CreateIcon sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
                  <Typography variant="h6">
                    新規投稿
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    新しい投稿を作成
                  </Typography>
                </CardContent>
                <CardActions>
                  <Button
                    size="small"
                    onClick={() => router.push('/board/new')}
                  >
                    作成
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          </Grid>
        </Paper>
      )}
    </Container>
  );
}