# 環境変数設定ガイド

## 必須環境変数

### 1. 基本設定

#### NODE_ENV
- **説明**: アプリケーションの実行環境
- **本番値**: `production`
- **開発値**: `development`

#### NEXT_PUBLIC_APP_URL
- **説明**: アプリケーションの公開URL
- **本番例**: `https://yourdomain.com`
- **開発値**: `http://localhost:3000`

### 2. 認証設定（NextAuth）

#### NEXTAUTH_URL
- **説明**: NextAuthのコールバックURL
- **本番例**: `https://yourdomain.com`
- **開発値**: `http://localhost:3000`

#### NEXTAUTH_SECRET
- **説明**: セッション暗号化用の秘密鍵
- **生成方法**: 
  ```bash
  openssl rand -base64 32
  ```
- **重要**: 32文字以上のランダム文字列を使用

### 3. データベース設定

#### DATABASE_URL
- **説明**: MongoDB接続文字列
- **形式**: `mongodb+srv://[username]:[password]@[cluster].mongodb.net/[database]?retryWrites=true&w=majority`
- **本番設定時の注意**:
  - パスワードに特殊文字が含まれる場合はURLエンコードする
  - SSL/TLS接続を必須にする
  - IPホワイトリストを設定

### 4. メール送信設定（SendGrid）

#### SENDGRID_API_KEY
- **説明**: SendGrid APIキー
- **取得方法**:
  1. SendGridダッシュボードにログイン
  2. Settings > API Keys
  3. "Create API Key"をクリック
  4. Full Accessまたは必要な権限を選択

#### SENDGRID_FROM_EMAIL
- **説明**: 送信元メールアドレス
- **例**: `noreply@yourdomain.com`
- **注意**: SendGridで認証済みのドメインを使用

#### SENDGRID_FROM_NAME
- **説明**: 送信者名
- **例**: `Your App Name`

## オプション環境変数

### セキュリティ設定

#### RATE_LIMIT_WINDOW_MS
- **説明**: レート制限のウィンドウ時間（ミリ秒）
- **デフォルト**: `60000`（1分）

#### RATE_LIMIT_MAX_REQUESTS
- **説明**: ウィンドウ内の最大リクエスト数
- **デフォルト**: `100`

### セッション設定

#### SESSION_MAX_AGE
- **説明**: セッションの最大有効期限（秒）
- **デフォルト**: `604800`（7日）

#### SESSION_UPDATE_AGE
- **説明**: セッション更新間隔（秒）
- **デフォルト**: `86400`（24時間）

### ログ設定

#### LOG_LEVEL
- **説明**: ログ出力レベル
- **値**: `error`, `warn`, `info`, `debug`
- **デフォルト**: `info`

#### ENABLE_AUDIT_LOG
- **説明**: 監査ログの有効化
- **値**: `true` or `false`
- **デフォルト**: `true`

### 画像アップロード設定

#### MAX_FILE_SIZE
- **説明**: 最大ファイルサイズ（バイト）
- **デフォルト**: `5242880`（5MB）

#### ALLOWED_FILE_TYPES
- **説明**: 許可するMIMEタイプ（カンマ区切り）
- **デフォルト**: `image/jpeg,image/png,image/gif,image/webp`

## Vercelでの設定方法

### 1. Vercelダッシュボードでの設定

1. プロジェクトのSettingsタブへ移動
2. "Environment Variables"セクションを選択
3. 各環境変数を追加：
   - Key: 環境変数名
   - Value: 値
   - Environment: Production/Preview/Development

### 2. Vercel CLIでの設定

```bash
# Vercel CLIのインストール
npm i -g vercel

# ログイン
vercel login

# 環境変数の設定
vercel env add NEXTAUTH_SECRET production
vercel env add DATABASE_URL production
# ... 他の環境変数も同様に
```

### 3. 一括設定用スクリプト

```bash
# .env.productionファイルから一括設定
vercel env pull .env.production
```

## セキュリティのベストプラクティス

### 1. 秘密情報の管理

- **絶対にしてはいけないこと**:
  - 秘密鍵をコードにハードコード
  - .envファイルをGitにコミット
  - 本番の認証情報を開発環境で使用

### 2. 環境変数の暗号化

Vercelは環境変数を暗号化して保存しますが、追加の対策として：
- 定期的に秘密鍵をローテーション
- 最小権限の原則に従う
- アクセスログを監視

### 3. 環境変数のバックアップ

```bash
# 環境変数のエクスポート（安全な場所に保管）
vercel env pull .env.backup
```

## トラブルシューティング

### よくある問題

1. **環境変数が反映されない**
   - Vercelで再デプロイを実行
   - キャッシュをクリア

2. **DATABASE_URL接続エラー**
   - IPホワイトリストを確認
   - パスワードの特殊文字をエンコード
   - 接続文字列の形式を確認

3. **メール送信エラー**
   - SendGrid APIキーの権限を確認
   - ドメイン認証の状態を確認
   - FROM_EMAILが認証済みか確認

## 環境別の設定例

### 開発環境（.env.local）
```env
NODE_ENV=development
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=development-secret-key
DATABASE_URL=mongodb://localhost:27017/board-dev
LOG_LEVEL=debug
```

### ステージング環境
```env
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://staging.yourdomain.com
NEXTAUTH_URL=https://staging.yourdomain.com
NEXTAUTH_SECRET=staging-secret-key-xxxxx
DATABASE_URL=mongodb+srv://staging-user:password@cluster.mongodb.net/staging
LOG_LEVEL=info
```

### 本番環境
```env
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://yourdomain.com
NEXTAUTH_URL=https://yourdomain.com
NEXTAUTH_SECRET=production-secret-key-xxxxx
DATABASE_URL=mongodb+srv://prod-user:password@cluster.mongodb.net/production
LOG_LEVEL=warn
```