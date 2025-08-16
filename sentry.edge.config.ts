import * as Sentry from '@sentry/nextjs';

const SENTRY_DSN = process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN;
const environment = process.env.NODE_ENV;

if (SENTRY_DSN) {
  Sentry.init({
    dsn: SENTRY_DSN,
    environment,
    
    // Edge環境用の設定
    tracesSampleRate: environment === 'production' ? 0.1 : 1.0,
    
    // エラーフィルタリング
    beforeSend(event, hint) {
      // Middleware固有のエラー処理
      const error = hint.originalException;
      
      // 認証関連のエラーは詳細を除去
      if (error && error.message && error.message.includes('auth')) {
        event.fingerprint = ['auth-error'];
        if (event.extra) {
          delete event.extra.session;
          delete event.extra.token;
        }
      }
      
      // リクエスト情報のサニタイズ
      if (event.request) {
        if (event.request.headers) {
          delete event.request.headers['authorization'];
          delete event.request.headers['cookie'];
        }
        
        // URLからセンシティブなクエリパラメータを除去
        if (event.request.url) {
          const url = new URL(event.request.url);
          url.searchParams.delete('token');
          url.searchParams.delete('session');
          url.searchParams.delete('key');
          event.request.url = url.toString();
        }
      }
      
      return event;
    },
    
    // Middlewareで無視するエラー
    ignoreErrors: [
      // レート制限
      'Rate limit exceeded',
      'Too many requests',
      
      // 正常な認証フロー
      'Unauthorized',
      'Forbidden',
    ],
  });
}