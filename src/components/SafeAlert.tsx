'use client';

import { Alert, AlertProps } from '@mui/material';
import { forwardRef, useEffect, useState } from 'react';

interface SafeAlertProps extends Omit<AlertProps, 'children'> {
  open: boolean;
  onClose?: () => void;
  children: React.ReactNode;
}

const SafeAlert = forwardRef<HTMLDivElement, SafeAlertProps>(
  ({ open, onClose, children, ...props }, ref) => {
    // DOM操作を安全にするため、レンダリングを遅延
    const [shouldRender, setShouldRender] = useState(false);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
      if (open) {
        setShouldRender(true);
        // 次のフレームで表示
        requestAnimationFrame(() => {
          setIsVisible(true);
        });
      } else {
        setIsVisible(false);
        // アニメーション完了後に削除
        const timer = setTimeout(() => {
          setShouldRender(false);
        }, 300); // MUIのデフォルトアニメーション時間
        return () => clearTimeout(timer);
      }
    }, [open]);

    if (!shouldRender) {
      return null;
    }

    return (
      <Alert 
        ref={ref} 
        {...props} 
        onClose={onClose}
        sx={{
          ...props.sx,
          opacity: isVisible ? 1 : 0,
          transform: isVisible ? 'translateY(0)' : 'translateY(-10px)',
          transition: 'opacity 300ms ease, transform 300ms ease',
        }}
      >
        {children}
      </Alert>
    );
  }
);

SafeAlert.displayName = 'SafeAlert';

export default SafeAlert;