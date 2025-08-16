'use client';

import { SessionProvider } from 'next-auth/react';
import { ReactNode, useState, useEffect } from 'react';

export default function Providers({ children }: { children: ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // マウント前は何も表示しない（SSRを無効化）
  if (!mounted) {
    return null;
  }

  return (
    <SessionProvider refetchInterval={0} refetchOnWindowFocus={false}>
      {children}
    </SessionProvider>
  );
}