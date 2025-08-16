import { LRUCache } from 'lru-cache';
import { NextRequest, NextResponse } from 'next/server';

// レート制限の設定タイプ
interface RateLimitConfig {
  windowMs: number;  // 時間枠（ミリ秒）
  max: number;       // 最大リクエスト数
  message?: string;  // エラーメッセージ
  keyGenerator?: (req: NextRequest) => string;  // キー生成関数
}

// 環境変数から設定を取得
const isProd = process.env.NODE_ENV === 'production';

// デフォルトのレート制限設定
export const rateLimitConfigs: Record<string, RateLimitConfig> = {
  // 投稿作成: 本番は1時間に10回、開発は1分間に5回
  createPost: {
    windowMs: isProd ? 60 * 60 * 1000 : 60 * 1000,
    max: isProd ? 10 : 5,
    message: isProd 
      ? '投稿の作成は1時間に10回までです。しばらくお待ちください。'
      : '投稿の作成は1分間に5回までです。しばらくお待ちください。',
  },
  // 投稿更新: 本番は1時間に30回、開発は1分間に10回
  updatePost: {
    windowMs: isProd ? 60 * 60 * 1000 : 60 * 1000,
    max: isProd ? 30 : 10,
    message: isProd
      ? '投稿の更新は1時間に30回までです。しばらくお待ちください。'
      : '投稿の更新は1分間に10回までです。しばらくお待ちください。',
  },
  // ログイン試行: 15分間に5回まで（本番・開発共通）
  login: {
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: 'ログイン試行回数が上限に達しました。15分後に再試行してください。',
  },
  // メール送信: 本番は1日10回、開発は1時間に3回
  sendEmail: {
    windowMs: isProd ? 24 * 60 * 60 * 1000 : 60 * 60 * 1000,
    max: isProd ? 10 : 3,
    message: isProd
      ? 'メール送信は1日10回までです。'
      : 'メール送信は1時間に3回までです。',
  },
  // API一般: 本番は1分間に100回、開発は60回
  general: {
    windowMs: 60 * 1000,
    max: isProd ? 100 : 60,
    message: 'リクエストが多すぎます。しばらくお待ちください。',
  },
};

// LRUキャッシュのインスタンス（各設定ごとに作成）
const caches = new Map<string, LRUCache<string, number>>();

// IPアドレスとユーザーIDからキーを生成
const defaultKeyGenerator = (req: NextRequest): string => {
  const forwarded = req.headers.get('x-forwarded-for');
  const ip = forwarded ? forwarded.split(',')[0] : 'unknown';
  
  // セッションからユーザーIDを取得（可能な場合）
  const userId = req.headers.get('x-user-id') || 'anonymous';
  
  return `${ip}:${userId}`;
};

// レート制限チェック関数
export async function checkRateLimit(
  req: NextRequest,
  configKey: string = 'general'
): Promise<{ allowed: boolean; remaining: number; reset: Date }> {
  const config = rateLimitConfigs[configKey] || rateLimitConfigs.general;
  const keyGenerator = config.keyGenerator || defaultKeyGenerator;
  const key = keyGenerator(req);
  
  // キャッシュが存在しない場合は作成
  if (!caches.has(configKey)) {
    caches.set(configKey, new LRUCache<string, number>({
      max: 10000, // 最大10,000キー
      ttl: config.windowMs,
    }));
  }
  
  const cache = caches.get(configKey)!;
  const now = Date.now();
  const count = cache.get(key) || 0;
  
  if (count >= config.max) {
    // レート制限に達した
    const ttl = cache.getRemainingTTL(key) || config.windowMs;
    return {
      allowed: false,
      remaining: 0,
      reset: new Date(now + ttl),
    };
  }
  
  // カウントを増やす
  cache.set(key, count + 1);
  
  return {
    allowed: true,
    remaining: config.max - count - 1,
    reset: new Date(now + config.windowMs),
  };
}

// レート制限ミドルウェア（API Routes用）
export function rateLimitMiddleware(configKey: string = 'general') {
  return async (req: NextRequest) => {
    const result = await checkRateLimit(req, configKey);
    
    if (!result.allowed) {
      const config = rateLimitConfigs[configKey] || rateLimitConfigs.general;
      return NextResponse.json(
        {
          error: config.message,
          retryAfter: result.reset.toISOString(),
        },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': String(config.max),
            'X-RateLimit-Remaining': String(result.remaining),
            'X-RateLimit-Reset': result.reset.toISOString(),
            'Retry-After': String(Math.ceil((result.reset.getTime() - Date.now()) / 1000)),
          },
        }
      );
    }
    
    // レート制限情報をヘッダーに追加
    const response = NextResponse.next();
    const config = rateLimitConfigs[configKey] || rateLimitConfigs.general;
    response.headers.set('X-RateLimit-Limit', String(config.max));
    response.headers.set('X-RateLimit-Remaining', String(result.remaining));
    response.headers.set('X-RateLimit-Reset', result.reset.toISOString());
    
    return response;
  };
}

// リセット関数（テスト用）
export function resetRateLimit(configKey: string, key?: string): void {
  const cache = caches.get(configKey);
  if (cache) {
    if (key) {
      cache.delete(key);
    } else {
      cache.clear();
    }
  }
}