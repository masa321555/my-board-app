export const authConfig = {
  pages: {
    signIn: '/auth/signin',
    signOut: '/auth/signout',
    error: '/auth/error',
    verifyRequest: '/auth/verify-request',
  },
  callbacks: {},
  providers: [], // Add providers with an empty array for now
  // セッション設定の最適化
  session: {
    // JWTを使用
    strategy: 'jwt',
    // セッションの最大有効期限: 7日
    maxAge: 7 * 24 * 60 * 60,
    // セッション更新間隔: 24時間
    updateAge: 24 * 60 * 60,
  },
  // JWT設定
  jwt: {
    // 最大有効期限: 7日
    maxAge: 7 * 24 * 60 * 60,
  },
  // Cookie設定
  cookies: {
    sessionToken: {
      name: `${process.env.NODE_ENV === 'production' ? '__Secure-' : ''}next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        maxAge: 7 * 24 * 60 * 60, // 7日
      },
    },
    callbackUrl: {
      name: `${process.env.NODE_ENV === 'production' ? '__Secure-' : ''}next-auth.callback-url`,
      options: {
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        maxAge: 24 * 60 * 60, // 24時間
      },
    },
    csrfToken: {
      name: `${process.env.NODE_ENV === 'production' ? '__Host-' : ''}next-auth.csrf-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        maxAge: 24 * 60 * 60, // 24時間
      },
    },
  },
  // セキュリティ設定
  useSecureCookies: process.env.NODE_ENV === 'production',
  // デバッグモード（開発環境のみ）
  debug: process.env.NODE_ENV === 'development',
};