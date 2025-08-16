#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise((resolve) => {
    rl.question(query, (answer) => {
      resolve(answer);
    });
  });
}

async function generateProductionEnv() {
  console.log('🚀 本番環境用設定ファイル生成ツール');
  console.log('=====================================\n');

  // 必要な情報を収集
  const domain = await question('本番環境のドメイン (例: app.example.com): ');
  const mongoUri = await question('MongoDB Atlas接続文字列: ');
  const sendgridApiKey = await question('SendGrid APIキー: ');
  const sendgridFromEmail = await question('送信元メールアドレス (例: noreply@example.com): ');
  const sendgridFromName = await question('送信者名 (例: Your App): ');
  
  // Sentry設定（オプション）
  const useSentry = await question('Sentryを使用しますか？ (y/N): ');
  let sentryDsn = '';
  if (useSentry.toLowerCase() === 'y') {
    sentryDsn = await question('Sentry DSN: ');
  }

  // カスタムレート制限（オプション）
  const customRateLimit = await question('カスタムレート制限を設定しますか？ (y/N): ');
  let rateLimitWindow = '60000';
  let rateLimitMax = '100';
  if (customRateLimit.toLowerCase() === 'y') {
    rateLimitWindow = await question('レート制限ウィンドウ (ミリ秒, デフォルト: 60000): ') || '60000';
    rateLimitMax = await question('最大リクエスト数 (デフォルト: 100): ') || '100';
  }

  rl.close();

  // 強力なシークレットキーを生成
  const nextAuthSecret = crypto.randomBytes(32).toString('base64');

  // 環境変数ファイルの内容
  const envContent = `# ===================================
# 本番環境設定
# 生成日時: ${new Date().toISOString()}
# ===================================

# アプリケーション設定
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://${domain}

# 認証設定
NEXTAUTH_URL=https://${domain}
NEXTAUTH_SECRET=${nextAuthSecret}

# データベース設定
DATABASE_URL=${mongoUri}

# メール送信設定
SENDGRID_API_KEY=${sendgridApiKey}
SENDGRID_FROM_EMAIL=${sendgridFromEmail}
SENDGRID_FROM_NAME=${sendgridFromName}

# セキュリティ設定
RATE_LIMIT_WINDOW_MS=${rateLimitWindow}
RATE_LIMIT_MAX_REQUESTS=${rateLimitMax}

# セッション設定
SESSION_MAX_AGE=604800
SESSION_UPDATE_AGE=86400

# ログ設定
LOG_LEVEL=info
ENABLE_AUDIT_LOG=true

# アップロード設定
MAX_FILE_SIZE=5242880
ALLOWED_FILE_TYPES=image/jpeg,image/png,image/gif,image/webp

${sentryDsn ? `# エラー監視
SENTRY_DSN=${sentryDsn}
SENTRY_ENVIRONMENT=production
NEXT_PUBLIC_SENTRY_DSN=${sentryDsn}` : '# Sentry未設定'}
`;

  // ファイルを保存
  const outputPath = path.join(__dirname, '..', '.env.production.local');
  fs.writeFileSync(outputPath, envContent);

  // Vercel用の環境変数リストも生成
  const vercelEnvPath = path.join(__dirname, '..', 'vercel-env.txt');
  const vercelEnvContent = envContent
    .split('\n')
    .filter(line => line.includes('=') && !line.startsWith('#'))
    .join('\n');
  
  fs.writeFileSync(vercelEnvPath, vercelEnvContent);

  console.log('\n✅ 設定ファイルの生成が完了しました！');
  console.log(`📄 環境変数ファイル: ${outputPath}`);
  console.log(`📄 Vercel用リスト: ${vercelEnvPath}`);
  
  console.log('\n⚠️  重要な注意事項:');
  console.log('1. .env.production.localは絶対にGitにコミットしないでください');
  console.log('2. NEXTAUTH_SECRETは自動生成されました（必要に応じて変更可）');
  console.log('3. Vercelダッシュボードでvercel-env.txtの内容を設定してください');
  console.log('4. 設定後は両ファイルを安全な場所に保管してください');
}

// 実行
generateProductionEnv().catch(console.error);