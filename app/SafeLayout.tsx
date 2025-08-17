'use client';

import { ReactNode, useEffect, useState } from 'react';

export default function SafeLayout({ children }: { children: ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // クライアントサイドでのみレンダリング
  if (!mounted) {
    return null;
  }

  return <>{children}</>;
}