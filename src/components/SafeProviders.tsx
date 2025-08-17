'use client';

import { SessionProvider } from 'next-auth/react';
import { ReactNode, useEffect, useRef } from 'react';

export default function SafeProviders({ children }: { children: ReactNode }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // DOMの監視を設定
    if (typeof window !== 'undefined' && containerRef.current) {
      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (mutation.type === 'childList' && mutation.removedNodes.length > 0) {
            // DOM変更検出 - ログは無効化
          }
        });
      });

      observer.observe(containerRef.current, {
        childList: true,
        subtree: true,
      });

      return () => observer.disconnect();
    }
  }, []);

  return (
    <div ref={containerRef} style={{ width: '100%', height: '100%' }}>
      <SessionProvider refetchInterval={0} refetchOnWindowFocus={false}>
        {children}
      </SessionProvider>
    </div>
  );
}