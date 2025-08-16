#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// 環境変数テンプレート
const envTemplate = `# ===================================
# 本番環境用環境変数
# ===================================
# このファイルをVercelの環境変数設定で使用してください
# 生成日時: ${new Date().toISOString()}

# アプリケーション設定
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://your-domain.com

# NextAuth設定
NEXTAUTH_URL=https://your-domain.com
NEXTAUTH_SECRET=${crypto.randomBytes(32).toString('base64')}

# MongoDB Atlas接続
# 形式: mongodb+srv://username:password@cluster.mongodb.net/database?retryWrites=true&w=majority
DATABASE_URL=

# SendGrid設定
SENDGRID_API_KEY=
SENDGRID_FROM_EMAIL=noreply@your-domain.com
SENDGRID_FROM_NAME=Your App Name

# セキュリティ設定（オプション）
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100

# セッション設定（オプション）
SESSION_MAX_AGE=604800
SESSION_UPDATE_AGE=86400

# ログ設定（オプション）
LOG_LEVEL=info
ENABLE_AUDIT_LOG=true

# 画像アップロード設定（オプション）
MAX_FILE_SIZE=5242880
ALLOWED_FILE_TYPES=image/jpeg,image/png,image/gif,image/webp

# モニタリング（オプション）
# SENTRY_DSN=
# SENTRY_ENVIRONMENT=production
`;

// ファイル出力
const outputPath = path.join(__dirname, '..', '.env.production.template');

fs.writeFileSync(outputPath, envTemplate);

console.log('✅ 環境変数テンプレートを生成しました');
console.log(`📄 ファイル: ${outputPath}`);
console.log('\n次のステップ:');
console.log('1. DATABASE_URLとSENDGRID_API_KEYを設定');
console.log('2. NEXT_PUBLIC_APP_URLとNEXTAUTH_URLをあなたのドメインに変更');
console.log('3. Vercelの環境変数設定画面で各値を設定');
console.log('\n⚠️  注意: NEXTAUTH_SECRETは自動生成されました。本番環境では必要に応じて変更してください。');