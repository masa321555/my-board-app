import * as Sentry from '@sentry/nextjs';

const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN;
const environment = process.env.NODE_ENV;

if (SENTRY_DSN) {
  Sentry.init({
    dsn: SENTRY_DSN,
    environment,
    
    // パフォーマンス監視
    tracesSampleRate: environment === 'production' ? 0.1 : 1.0,
    
    // セッションリプレイ（オプション）
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
    
    // 統合設定
    integrations: [
      Sentry.replayIntegration({
        maskAllText: true,
        blockAllMedia: true,
      }),
    ],
    
    // エラーフィルタリング
    beforeSend(event, hint) {
      // 開発環境のエラーを除外
      if (environment === 'development') {
        return null;
      }
      
      // 特定のエラーを除外
      const error = hint.originalException;
      
      // ネットワークエラーを除外
      if (error && error.message && error.message.includes('NetworkError')) {
        return null;
      }
      
      // キャンセルされたリクエストを除外
      if (error && error.name === 'AbortError') {
        return null;
      }
      
      // 個人情報をマスク
      if (event.request?.cookies) {
        delete event.request.cookies;
      }
      
      if (event.user) {
        event.user = {
          id: event.user.id,
          // メールアドレスなどの個人情報を除外
        };
      }
      
      return event;
    },
    
    // 無視するエラー
    ignoreErrors: [
      // ブラウザ拡張機能によるエラー
      'top.GLOBALS',
      'ResizeObserver loop limit exceeded',
      'ResizeObserver loop completed with undelivered notifications',
      
      // 一般的なネットワークエラー
      'NetworkError',
      'Failed to fetch',
      'Load failed',
      
      // Safari特有のエラー
      'Non-Error promise rejection captured',
    ],
    
    // 無視するURL
    denyUrls: [
      // Chrome拡張機能
      /extensions\//i,
      /^chrome:\/\//i,
      /^chrome-extension:\/\//i,
      
      // Firefox拡張機能
      /^moz-extension:\/\//i,
      
      // Safari拡張機能
      /^safari-extension:\/\//i,
      
      // その他
      /^resource:\/\//i,
    ],
  });
}