import { NextRequest, NextResponse } from 'next/server';

// セキュリティヘッダーの定義
export const securityHeaders = {
  // XSS保護を有効化
  'X-XSS-Protection': '1; mode=block',
  
  // クリックジャッキング対策
  'X-Frame-Options': 'DENY',
  
  // MIMEタイプのスニッフィングを防ぐ
  'X-Content-Type-Options': 'nosniff',
  
  // リファラー情報の制限
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  
  // 権限ポリシー（旧Feature-Policy）
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
  
  // DNS プリフェッチの制御
  'X-DNS-Prefetch-Control': 'on',
  
  // IE8以降でダウンロードしたファイルを開く際の警告
  'X-Download-Options': 'noopen',
  
  // フレーム内でのレンダリングを許可するオリジン
  'X-Permitted-Cross-Domain-Policies': 'none',
};

// 本番環境用の追加ヘッダー
export const productionHeaders = {
  // HTTPS強制（1年間、サブドメインを含む）
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
  
  // コンテンツセキュリティポリシー
  'Content-Security-Policy': generateCSP(),
};

// CSPの生成
function generateCSP(): string {
  const isDevelopment = process.env.NODE_ENV === 'development';
  const directives: Record<string, string[]> = {
    'default-src': ["'self'"],
    'script-src': [
      "'self'",
      "'unsafe-inline'", // Next.jsのインラインスクリプト用
      isDevelopment ? "'unsafe-eval'" : '', // 開発環境のみ
      'https://www.google-analytics.com',
      'https://www.googletagmanager.com',
      'https://*.sentry.io', // Sentry
      'https://vercel.live', // Vercel Analytics
    ].filter(Boolean),
    'style-src': [
      "'self'",
      "'unsafe-inline'", // MUIのインラインスタイル用
      'https://fonts.googleapis.com',
    ],
    'img-src': [
      "'self'",
      'data:',
      'blob:',
      'https://*.s3.amazonaws.com', // S3画像用
      'https://*.s3.ap-northeast-1.amazonaws.com',
      'https://*.vercel-insights.com', // Vercel Analytics
    ],
    'font-src': [
      "'self'",
      'https://fonts.gstatic.com',
    ],
    'connect-src': [
      "'self'",
      'https://api.sendgrid.com', // SendGrid API
      'https://*.sentry.io', // Sentry
      'https://vitals.vercel-insights.com', // Vercel Analytics
      'wss://*.vercel.app', // WebSocket for hot reload
      process.env.NEXT_PUBLIC_API_URL || '',
    ].filter(Boolean),
    'media-src': ["'self'"],
    'object-src': ["'none'"],
    'child-src': ["'none'"],
    'frame-src': ["'none'"],
    'worker-src': ["'self'", 'blob:'],
    'form-action': ["'self'"],
    'base-uri': ["'self'"],
    'manifest-src': ["'self'"],
    'upgrade-insecure-requests': [],
    'block-all-mixed-content': [],
  };

  // 本番環境でのみreport-uriを追加
  if (!isDevelopment && process.env.CSP_REPORT_URI) {
    directives['report-uri'] = [process.env.CSP_REPORT_URI];
  }

  return Object.entries(directives)
    .map(([key, values]) => {
      if (values.length === 0) return key;
      return `${key} ${values.join(' ')}`;
    })
    .join('; ');
}

// セキュリティヘッダーを適用する関数
export function applySecurityHeaders(response: NextResponse): NextResponse {
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  // 基本的なセキュリティヘッダーを適用
  Object.entries(securityHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });
  
  // 本番環境の場合は追加のヘッダーを適用
  if (!isDevelopment) {
    Object.entries(productionHeaders).forEach(([key, value]) => {
      response.headers.set(key, value);
    });
  }
  
  return response;
}

// ミドルウェア用のセキュリティヘッダー関数
export function withSecurityHeaders(req: NextRequest, res: NextResponse): NextResponse {
  return applySecurityHeaders(res);
}

// APIルート用のセキュリティヘッダー設定
export function apiSecurityHeaders(): HeadersInit {
  return {
    ...securityHeaders,
    'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0',
    'Surrogate-Control': 'no-store',
  };
}

// 静的ファイル用のセキュリティヘッダー設定
export function staticSecurityHeaders(): HeadersInit {
  return {
    ...securityHeaders,
    'Cache-Control': 'public, max-age=31536000, immutable',
  };
}