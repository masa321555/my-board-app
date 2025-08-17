'use client';

import { signOut, useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
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
    if (!mounted) return;
    
    try {
      await signOut({ redirect: false });
      router.push('/auth/signin');
    } catch (error) {
      console.error('Sign out error:', error);
    }
  }, [mounted, router]);

  const handleNavigation = useCallback((path: string) => {
    console.log(`Menu navigation clicked: ${path}`);
    
    if (!mounted) {
      console.log('Navigation blocked - component not mounted');
      return;
    }
    
    handleClose();
    
    // 現在のページと同じ場合はページをリロード
    const currentPath = window.location.pathname;
    if (currentPath === path) {
      console.log('Same page - reloading');
      window.location.reload();
      return;
    }
    
    // window.location.hrefを使用して確実にナビゲーション
    console.log(`Navigating to: ${path}`);
    window.location.href = path;
  }, [mounted, handleClose]);

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
            <Box
              component="a"
              href="/dashboard"
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                color: 'inherit',
                textDecoration: 'none',
                px: 1,
                py: 0.75,
                borderRadius: 1,
                mr: 1,
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.08)',
                },
              }}
            >
              <DashboardIcon sx={{ mr: 0.5, fontSize: 20 }} />
              ダッシュボード
            </Box>
            <Box
              component="a"
              href="/board"
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                color: 'inherit',
                textDecoration: 'none',
                px: 1,
                py: 0.75,
                borderRadius: 1,
                mr: 2,
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.08)',
                },
              }}
            >
              <ArticleIcon sx={{ mr: 0.5, fontSize: 20 }} />
              掲示板
            </Box>
            
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
                vertical: 'bottom',
                horizontal: 'right',
              }}
              keepMounted={false}
              transformOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
              open={Boolean(anchorEl)}
              onClose={handleClose}
              disablePortal
              slotProps={{
                paper: {
                  elevation: 8,
                  sx: {
                    overflow: 'visible',
                    filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.32))',
                    mt: 1.5,
                  },
                },
              }}
            >
              <MenuItem 
                onClick={() => handleNavigation('/dashboard')}
              >
                <DashboardIcon sx={{ mr: 1, fontSize: 20 }} />
                ダッシュボード
              </MenuItem>
              <MenuItem 
                onClick={() => handleNavigation('/board')}
              >
                <ArticleIcon sx={{ mr: 1, fontSize: 20 }} />
                掲示板
              </MenuItem>
              <MenuItem 
                onClick={() => handleNavigation('/profile')}
              >
                <PersonIcon sx={{ mr: 1, fontSize: 20 }} />
                プロフィール
              </MenuItem>
              <MenuItem divider />
              <MenuItem 
                onClick={handleSignOut}
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
            >
              ログイン
            </Button>
            <Button 
              color="inherit" 
              onClick={() => handleNavigation('/auth/register')}
            >
              新規登録
            </Button>
          </Box>
        )}
      </Toolbar>
    </AppBar>
  );
}