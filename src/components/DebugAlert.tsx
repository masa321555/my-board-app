'use client';

import { Alert, AlertProps, Box } from '@mui/material';
import { forwardRef, useEffect, useRef, useState } from 'react';

interface DebugAlertProps extends Omit<AlertProps, 'children'> {
  open: boolean;
  onClose?: () => void;
  children: React.ReactNode;
}

const DebugAlert = forwardRef<HTMLDivElement, DebugAlertProps>(
  ({ open, onClose, children, ...props }, ref) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
      setMounted(true);
      return () => setMounted(false);
    }, []);

    // DOM要素を監視
    useEffect(() => {
      if (!containerRef.current) return;

      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (mutation.type === 'childList') {
            console.log('DOM変更検出:', {
              type: mutation.type,
              addedNodes: mutation.addedNodes.length,
              removedNodes: mutation.removedNodes.length,
              target: mutation.target,
            });
          }
        });
      });

      observer.observe(containerRef.current, {
        childList: true,
        subtree: true,
      });

      return () => observer.disconnect();
    }, [mounted]);

    // 非表示の場合は何もレンダリングしない
    if (!open || !mounted) {
      return null;
    }

    return (
      <Box ref={containerRef} sx={{ position: 'relative' }}>
        <Alert 
          ref={ref} 
          {...props} 
          onClose={onClose}
        >
          {children}
        </Alert>
      </Box>
    );
  }
);

DebugAlert.displayName = 'DebugAlert';

export default DebugAlert;