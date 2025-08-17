'use client';

import { Box, IconButton, Typography } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { forwardRef } from 'react';

interface StableAlertProps {
  open: boolean;
  severity: 'error' | 'warning' | 'info' | 'success';
  onClose?: () => void;
  children: React.ReactNode;
  sx?: any;
}

const severityColors = {
  error: {
    bg: '#fef2f2',
    border: '#fee2e2',
    text: '#dc2626',
  },
  warning: {
    bg: '#fffbeb',
    border: '#fef3c7',
    text: '#d97706',
  },
  info: {
    bg: '#eff6ff',
    border: '#dbeafe',
    text: '#2563eb',
  },
  success: {
    bg: '#f0fdf4',
    border: '#dcfce7',
    text: '#16a34a',
  },
};

const StableAlert = forwardRef<HTMLDivElement, StableAlertProps>(
  ({ open, severity, onClose, children, sx }, ref) => {
    // 非表示の場合は何もレンダリングしない
    if (!open) {
      return null;
    }

    const colors = severityColors[severity];

    return (
      <Box
        ref={ref}
        sx={{
          backgroundColor: colors.bg,
          border: `1px solid ${colors.border}`,
          borderRadius: 1,
          padding: 2,
          marginBottom: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          ...sx,
        }}
      >
        <Typography
          sx={{
            color: colors.text,
            fontSize: '0.875rem',
            flex: 1,
          }}
        >
          {children}
        </Typography>
        {onClose && (
          <IconButton
            size="small"
            onClick={onClose}
            sx={{
              color: colors.text,
              marginLeft: 1,
              padding: 0.5,
            }}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        )}
      </Box>
    );
  }
);

StableAlert.displayName = 'StableAlert';

export default StableAlert;