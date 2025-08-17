import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { applySecurityHeaders } from '@/lib/security-headers';
import { checkRateLimit } from '@/lib/rate-limiter';
// import { logRateLimitExceeded, logUnauthorizedAccess } from '@/lib/audit-logger';

export default withAuth(
  async function middleware(req) {
    const token = req.nextauth.token;
    const { pathname, search } = req.nextUrl;
    
    // レート制限チェック（APIルートのみ）
    if (pathname.startsWith('/api/')) {
      const rateLimitKey = determineRateLimitKey(pathname);
      const rateLimitResult = await checkRateLimit(req, rateLimitKey);
      
      if (!rateLimitResult.allowed) {
        // レート制限超過をログに記録（Edge Runtimeでは無効）
        // await logRateLimitExceeded(token?.id as string | undefined, pathname, req);
        
        return NextResponse.json(
          { error: 'リクエストが多すぎます。しばらくお待ちください。' },
          { 
            status: 429,
            headers: {
              'X-RateLimit-Limit': String(rateLimitResult.remaining),
              'X-RateLimit-Reset': rateLimitResult.reset.toISOString(),
              'Retry-After': String(Math.ceil((rateLimitResult.reset.getTime() - Date.now()) / 1000)),
            },
          }
        );
      }
    }
    
    // 開発環境ではメール確認をスキップ
    const isDevelopment = process.env.NODE_ENV === 'development';
    
    // メール未確認ユーザーのアクセス制限（本番環境のみ）
    if (!isDevelopment && token && !token.emailVerified) {
      // 特定のパスはメール確認不要
      const emailVerificationExemptPaths = [
        '/',
        '/auth/',
        '/api/auth/',
        '/public/',
        '/_next/',
        '/favicon.ico'
      ];
      const isExempt = emailVerificationExemptPaths.some(path => 
        pathname === path || pathname.startsWith(path)
      );
      
      if (!isExempt) {
        return NextResponse.redirect(new URL('/auth/verify-email', req.url));
      }
    }
    
    // 管理者エリアのアクセス制限
    if (pathname.startsWith('/admin') && token?.role !== 'admin') {
      // 不正アクセスをログに記録（Edge Runtimeでは無効）
      // await logUnauthorizedAccess(token?.id as string | undefined, '/admin', req);
      return NextResponse.redirect(new URL('/unauthorized', req.url));
    }
    
    // レスポンスにセキュリティヘッダーを追加
    const response = NextResponse.next();
    return applySecurityHeaders(response);
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl;
        
        // 公開ページ（認証不要）
        const publicPaths = [
          '/',
          '/auth/signin',
          '/auth/register',
          '/auth/forgot-password',
          '/auth/reset-password',
          '/auth/verify',
          '/auth/email-confirmed',
          '/api/auth/',
        ];
        
        // 公開ページかどうかチェック
        const isPublicPath = publicPaths.some(path => 
          pathname === path || pathname.startsWith(path)
        );
        
        if (isPublicPath) {
          return true;
        }
        
        // その他のページは認証が必要
        return !!token;
      },
    },
    pages: {
      signIn: '/auth/signin',
      error: '/auth/error',
    },
  }
);

// レート制限のキーを決定する関数
function determineRateLimitKey(pathname: string): string {
  if (pathname.includes('/auth/signin')) return 'login';
  if (pathname.includes('/posts') && pathname.endsWith('/posts')) return 'createPost';
  if (pathname.includes('/posts/') && !pathname.endsWith('/posts')) return 'updatePost';
  if (pathname.includes('/email')) return 'sendEmail';
  return 'general';
}

// ミドルウェアを適用するパスの設定
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     * - uploads folder (user uploads)
     */
    '/((?!_next/static|_next/image|favicon.ico|public/|uploads/).*)',
  ],
};