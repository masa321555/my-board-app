import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation';

interface UseRequireAuthOptions {
  redirectTo?: string;
  redirectIfAuthenticated?: boolean;
}

export function useRequireAuth(options: UseRequireAuthOptions = {}) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  
  const {
    redirectTo = `/auth/signin?callbackUrl=${encodeURIComponent(pathname)}`,
    redirectIfAuthenticated = false,
  } = options;

  useEffect(() => {
    if (status === 'loading') return;

    // 認証が必要なページで未認証の場合
    if (!redirectIfAuthenticated && status === 'unauthenticated') {
      router.push(redirectTo);
    }

    // 認証済みユーザーを別のページにリダイレクト（ログインページなど）
    if (redirectIfAuthenticated && status === 'authenticated') {
      router.push(redirectTo);
    }
  }, [status, router, redirectTo, redirectIfAuthenticated]);

  return {
    session,
    status,
    isLoading: status === 'loading',
    isAuthenticated: status === 'authenticated',
  };
}