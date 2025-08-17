'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
  Container,
  Box,
  Typography,
  Paper,
  Card,
  CardContent,
  CardActions,
  Button,
  Divider,
  Skeleton,
} from '@mui/material';
import Grid from '@mui/material/Grid2';
import {
  Dashboard as DashboardIcon,
  Article as ArticleIcon,
  Person as PersonIcon,
  Settings as SettingsIcon,
  TrendingUp as TrendingUpIcon,
  Forum as ForumIcon,
  Edit as EditIcon,
  Add as AddIcon,
} from '@mui/icons-material';
import ProtectedLayout from '@/components/ProtectedLayout';
import { useState, useEffect } from 'react';

interface DashboardStats {
  totalPosts: number;
  recentPosts: number;
  totalComments: number;
  profileViews: number;
}

interface RecentPost {
  id: string;
  title: string;
  createdAt: string;
  views: number;
  comments: number;
}

export default function DashboardPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentPosts, setRecentPosts] = useState<RecentPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // ダッシュボードデータを取得
    const fetchDashboardData = async () => {
      if (!session?.user?.id) return;
      
      setIsLoading(true);
      try {
        const response = await fetch('/api/user/dashboard');
        const data = await response.json();
        
        if (response.ok) {
          setStats(data.stats);
          setRecentPosts(data.recentPosts);
        } else {
          console.error('Failed to fetch dashboard data:', data.error);
        }
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, [session]);

  const StatCard = ({ 
    title, 
    value, 
    icon, 
    color = 'primary.main' 
  }: { 
    title: string; 
    value: number | string; 
    icon: React.ReactNode; 
    color?: string;
  }) => (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Box sx={{ color, mr: 2 }}>{icon}</Box>
          <Typography variant="h6" component="div">
            {title}
          </Typography>
        </Box>
        {isLoading ? (
          <Skeleton variant="text" width="60%" height={40} />
        ) : (
          <Typography variant="h3" component="div" sx={{ fontWeight: 'bold' }}>
            {value}
          </Typography>
        )}
      </CardContent>
    </Card>
  );

  return (
    <ProtectedLayout>
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        {/* ヘッダー */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            <DashboardIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
            ダッシュボード
          </Typography>
          <Typography variant="body1" color="text.secondary">
            ようこそ、{session?.user?.name}さん
          </Typography>
        </Box>

        {/* 統計カード */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid xs={12} sm={6} md={3}>
            <StatCard
              title="投稿数"
              value={stats?.totalPosts || 0}
              icon={<ArticleIcon />}
              color="primary.main"
            />
          </Grid>
          <Grid xs={12} sm={6} md={3}>
            <StatCard
              title="今週の投稿"
              value={stats?.recentPosts || 0}
              icon={<TrendingUpIcon />}
              color="success.main"
            />
          </Grid>
          <Grid xs={12} sm={6} md={3}>
            <StatCard
              title="コメント数"
              value={stats?.totalComments || 0}
              icon={<ForumIcon />}
              color="info.main"
            />
          </Grid>
          <Grid xs={12} sm={6} md={3}>
            <StatCard
              title="プロフィール閲覧"
              value={stats?.profileViews || 0}
              icon={<PersonIcon />}
              color="warning.main"
            />
          </Grid>
        </Grid>

        {/* クイックアクション */}
        <Paper sx={{ p: 3, mb: 4 }}>
          <Typography variant="h6" gutterBottom>
            クイックアクション
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mt: 2 }}>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => router.push('/board/new')}
            >
              新規投稿
            </Button>
            <Button
              variant="outlined"
              startIcon={<PersonIcon />}
              onClick={() => router.push('/profile')}
            >
              プロフィール編集
            </Button>
            <Button
              variant="outlined"
              startIcon={<ForumIcon />}
              onClick={() => router.push('/board')}
            >
              掲示板を見る
            </Button>
            <Button
              variant="outlined"
              startIcon={<SettingsIcon />}
              onClick={() => router.push('/settings')}
            >
              設定
            </Button>
          </Box>
        </Paper>

        {/* 最近の投稿 */}
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            最近の投稿
          </Typography>
          <Divider sx={{ mb: 2 }} />
          
          {isLoading ? (
            <>
              <Skeleton variant="rectangular" height={80} sx={{ mb: 2 }} />
              <Skeleton variant="rectangular" height={80} sx={{ mb: 2 }} />
              <Skeleton variant="rectangular" height={80} />
            </>
          ) : recentPosts.length > 0 ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {recentPosts.map((post) => (
                <Card key={post.id} variant="outlined">
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      {post.title}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 3, color: 'text.secondary' }}>
                      <Typography variant="body2">
                        投稿日: {new Date(post.createdAt).toLocaleDateString('ja-JP')}
                      </Typography>
                      <Typography variant="body2">
                        閲覧数: {post.views}
                      </Typography>
                      <Typography variant="body2">
                        コメント: {post.comments}
                      </Typography>
                    </Box>
                  </CardContent>
                  <CardActions>
                    <Button
                      size="small"
                      startIcon={<EditIcon />}
                      onClick={() => router.push(`/board/${post.id}/edit`)}
                    >
                      編集
                    </Button>
                  </CardActions>
                </Card>
              ))}
            </Box>
          ) : (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="body1" color="text.secondary" gutterBottom>
                まだ投稿がありません
              </Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => router.push('/board/new')}
                sx={{ mt: 2 }}
              >
                最初の投稿を作成
              </Button>
            </Box>
          )}
        </Paper>
      </Container>
    </ProtectedLayout>
  );
}