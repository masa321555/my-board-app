'use client';

import { signOut, useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  IconButton,
  Menu,
  MenuItem,
} from '@mui/material';
import {
  AccountCircle as AccountCircleIcon,
  Dashboard as DashboardIcon,
  Article as ArticleIcon,
  Person as PersonIcon,
} from '@mui/icons-material';
import { useState, useEffect, useRef, useCallback } from 'react';

export default function Header() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [mounted, setMounted] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const isNavigating = useRef(false);

  // コンポーネントのマウント状態を管理
  useEffect(() => {
    setMounted(true);
    return () => {
      setMounted(false);
      setAnchorEl(null);
    };
  }, []);

  // メニューの外側をクリックした時の処理
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setAnchorEl(null);
      }
    };

    if (mounted && anchorEl) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [mounted, anchorEl]);

  const handleMenu = useCallback((event: React.MouseEvent<HTMLElement>) => {
    if (mounted) {
      setAnchorEl(event.currentTarget);
    }
  }, [mounted]);

  const handleClose = useCallback(() => {
    if (mounted) {
      setAnchorEl(null);
    }
  }, [mounted]);

  const handleSignOut = useCallback(async () => {
    if (isNavigating.current || !mounted) return;
    
    try {
      isNavigating.current = true;
      await signOut({ redirect: false });
      router.push('/auth/signin');
    } catch (error) {
      console.error('Sign out error:', error);
    } finally {
      // ログアウト完了後に状態をリセット
      setTimeout(() => {
        isNavigating.current = false;
      }, 100);
    }
  }, [mounted, router]);

  const handleNavigation = useCallback((path: string) => {
    if (isNavigating.current || !mounted) return;
    
    handleClose();
    isNavigating.current = true;
    
    try {
      router.push(path);
    } catch (error) {
      console.error('Navigation error:', error);
    } finally {
      // ナビゲーション完了後に状態をリセット
      setTimeout(() => {
        isNavigating.current = false;
      }, 100);
    }
  }, [mounted, router, handleClose]);

  // マウント前は基本的なヘッダーのみ表示
  if (!mounted) {
    return (
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            会員制掲示板
          </Typography>
        </Toolbar>
      </AppBar>
    );
  }

  return (
    <AppBar position="static">
      <Toolbar>
        <Typography 
          variant="h6" 
          component="div" 
          sx={{ 
            flexGrow: 1,
            cursor: 'pointer',
            '&:hover': { opacity: 0.8 }
          }}
          onClick={() => handleNavigation('/')}
        >
          会員制掲示板
        </Typography>
        
        {status === 'authenticated' && session?.user && (
          <Box sx={{ display: 'flex', alignItems: 'center' }} ref={menuRef}>
            {/* クイックナビゲーション */}
            <Button
              color="inherit"
              onClick={() => handleNavigation('/dashboard')}
              sx={{ mr: 1 }}
              startIcon={<DashboardIcon />}
            >
              ダッシュボード
            </Button>
            <Button
              color="inherit"
              onClick={() => handleNavigation('/board')}
              sx={{ mr: 2 }}
              startIcon={<ArticleIcon />}
            >
              掲示板
            </Button>
            
            {/* ユーザー名とメニュー */}
            <Typography variant="body2" sx={{ mr: 2 }}>
              {session.user.name}さん
            </Typography>
            <IconButton
              size="large"
              aria-label="account of current user"
              aria-controls="menu-appbar"
              aria-haspopup="true"
              onClick={handleMenu}
              color="inherit"
            >
              <AccountCircleIcon />
            </IconButton>
            <Menu
              id="menu-appbar"
              anchorEl={anchorEl}
              anchorOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
              keepMounted
              transformOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
              open={Boolean(anchorEl)}
              onClose={handleClose}
              disablePortal={false}
              slotProps={{
                paper: {
                  style: {
                    zIndex: 1300,
                  },
                },
              }}
            >
              <MenuItem 
                onClick={() => handleNavigation('/dashboard')}
                disabled={isNavigating.current}
              >
                <DashboardIcon sx={{ mr: 1, fontSize: 20 }} />
                ダッシュボード
              </MenuItem>
              <MenuItem 
                onClick={() => handleNavigation('/board')}
                disabled={isNavigating.current}
              >
                <ArticleIcon sx={{ mr: 1, fontSize: 20 }} />
                掲示板
              </MenuItem>
              <MenuItem 
                onClick={() => handleNavigation('/profile')}
                disabled={isNavigating.current}
              >
                <PersonIcon sx={{ mr: 1, fontSize: 20 }} />
                プロフィール
              </MenuItem>
              <MenuItem divider />
              <MenuItem 
                onClick={handleSignOut}
                disabled={isNavigating.current}
              >
                ログアウト
              </MenuItem>
            </Menu>
          </Box>
        )}
        
        {status === 'unauthenticated' && (
          <Box>
            <Button 
              color="inherit" 
              onClick={() => handleNavigation('/auth/signin')}
              disabled={isNavigating.current}
            >
              ログイン
            </Button>
            <Button 
              color="inherit" 
              onClick={() => handleNavigation('/auth/register')}
              disabled={isNavigating.current}
            >
              新規登録
            </Button>
          </Box>
        )}
      </Toolbar>
    </AppBar>
  );
}