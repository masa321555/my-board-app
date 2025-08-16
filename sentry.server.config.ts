import * as Sentry from '@sentry/nextjs';

const SENTRY_DSN = process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN;
const environment = process.env.NODE_ENV;

if (SENTRY_DSN) {
  Sentry.init({
    dsn: SENTRY_DSN,
    environment,
    
    // パフォーマンス監視
    tracesSampleRate: environment === 'production' ? 0.1 : 1.0,
    
    // プロファイリング（Node.js 16+）
    profilesSampleRate: environment === 'production' ? 0.1 : 1.0,
    
    // 統合設定
    integrations: [
      // HTTP統合
      Sentry.httpIntegration({
        tracing: true,
      }),
      
      // Prisma統合（使用している場合）
      // Sentry.prismaIntegration(),
    ],
    
    // エラーフィルタリング
    beforeSend(event, hint) {
      // 開発環境のエラーを除外
      if (environment === 'development') {
        // 重要なエラーのみ送信
        const error = hint.originalException;
        if (error && error.message && !error.message.includes('Critical')) {
          return null;
        }
      }
      
      // センシティブな情報を除去
      if (event.request) {
        // ヘッダーから認証情報を除去
        if (event.request.headers) {
          delete event.request.headers['authorization'];
          delete event.request.headers['cookie'];
          delete event.request.headers['x-api-key'];
        }
        
        // ボディからパスワードを除去
        if (event.request.data && typeof event.request.data === 'object') {
          const data = { ...event.request.data };
          delete data.password;
          delete data.confirmPassword;
          delete data.oldPassword;
          delete data.newPassword;
          event.request.data = data;
        }
      }
      
      // MongoDBエラーの詳細情報を除去
      if (event.exception && event.exception.values) {
        event.exception.values = event.exception.values.map(exception => {
          if (exception.stacktrace && exception.stacktrace.frames) {
            exception.stacktrace.frames = exception.stacktrace.frames.filter(
              frame => !frame.filename?.includes('node_modules/mongodb')
            );
          }
          return exception;
        });
      }
      
      return event;
    },
    
    // 無視するエラー
    ignoreErrors: [
      // 予期されるエラー
      'ユーザーが見つかりません',
      '認証が必要です',
      'アクセス権限がありません',
      
      // レート制限
      'リクエストが多すぎます',
      
      // バリデーションエラー
      'ValidationError',
    ],
    
    // トランザクション名の正規化
    beforeSendTransaction(event) {
      // 動的なルートパラメータを正規化
      if (event.transaction) {
        event.transaction = event.transaction
          .replace(/\/posts\/[a-f0-9]{24}/g, '/posts/[id]')
          .replace(/\/user\/[a-f0-9]{24}/g, '/user/[id]')
          .replace(/\/api\/posts\/[a-f0-9]{24}/g, '/api/posts/[id]');
      }
      
      return event;
    },
  });
}