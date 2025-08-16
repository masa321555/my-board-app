# Vercelデプロイ手順書

## 前提条件

- GitHubアカウント
- Vercelアカウント
- MongoDB Atlasアカウント  
- SendGridアカウント
- カスタムドメイン（オプション）

## 1. 事前準備

### 1.1 コードの準備

```bash
# ビルドテスト
npm run build

# TypeScriptエラーチェック
npm run type-check

# Lintチェック
npm run lint

# テスト実行
npm test

# セキュリティ監査
npm audit --production
```

### 1.2 環境変数の準備

以下の値を事前に準備：

```
NEXTAUTH_SECRET=（32文字以上のランダム文字列）
DATABASE_URL=（MongoDB Atlas接続文字列）
SENDGRID_API_KEY=（SendGrid APIキー）
SENDGRID_FROM_EMAIL=（送信元メールアドレス）
```

## 2. GitHubへのプッシュ

### 2.1 リポジトリ作成

1. GitHubで新規リポジトリ作成
2. プライベートリポジトリとして作成（推奨）

### 2.2 初回プッシュ

```bash
# Gitの初期化（まだの場合）
git init

# リモートリポジトリの追加
git remote add origin https://github.com/yourusername/your-repo.git

# すべてのファイルをステージング
git add .

# 初回コミット
git commit -m "Initial commit for production deployment"

# mainブランチにプッシュ
git push -u origin main
```

## 3. Vercelでのセットアップ

### 3.1 プロジェクトのインポート

1. [Vercel Dashboard](https://vercel.com/dashboard)にログイン
2. "New Project"をクリック
3. GitHubアカウントを連携
4. リポジトリを選択してインポート

### 3.2 プロジェクト設定

#### Framework Preset
- **Framework**: Next.js
- **Root Directory**: ./

#### Build & Development Settings
```
Build Command: npm run build
Output Directory: .next
Install Command: npm install
Development Command: npm run dev
```

#### Node.js Version
- 20.x（推奨）

### 3.3 環境変数の設定

1. Settingsタブ → Environment Variables
2. 以下の環境変数を追加：

```bash
# 必須環境変数
NODE_ENV=production
NEXTAUTH_URL=https://yourdomain.vercel.app
NEXTAUTH_SECRET=[生成した秘密鍵]
DATABASE_URL=[MongoDB Atlas接続文字列]
SENDGRID_API_KEY=[SendGrid APIキー]
SENDGRID_FROM_EMAIL=noreply@yourdomain.com
SENDGRID_FROM_NAME=Your App Name

# オプション環境変数
NEXT_PUBLIC_APP_URL=https://yourdomain.vercel.app
LOG_LEVEL=info
ENABLE_AUDIT_LOG=true
```

**重要**: 各環境変数のEnvironmentで"Production"を選択

## 4. 初回デプロイ

### 4.1 デプロイの実行

1. "Deploy"ボタンをクリック
2. ビルドログを監視
3. エラーがないことを確認

### 4.2 デプロイの確認

デプロイ完了後：
- プレビューURLにアクセス
- 基本機能の動作確認

## 5. カスタムドメインの設定

### 5.1 ドメインの追加

1. Settingsタブ → Domains
2. "Add"をクリック
3. ドメイン名を入力（例: app.yourdomain.com）

### 5.2 DNS設定

#### Aレコード（ルートドメインの場合）
```
Type: A
Name: @
Value: 76.76.21.21
```

#### CNAMEレコード（サブドメインの場合）
```
Type: CNAME  
Name: app
Value: cname.vercel-dns.com
```

### 5.3 SSL証明書

- Vercelが自動的にLet's Encrypt証明書を発行
- 通常、数分で有効化

## 6. 本番環境の検証

### 6.1 機能テスト

- [ ] ユーザー登録
- [ ] ログイン/ログアウト
- [ ] メール送信（確認メール）
- [ ] 投稿の作成・編集・削除
- [ ] プロフィール編集
- [ ] 画像アップロード

### 6.2 セキュリティ確認

```bash
# セキュリティヘッダーの確認
curl -I https://yourdomain.com

# SSLの確認
openssl s_client -connect yourdomain.com:443 -servername yourdomain.com
```

### 6.3 パフォーマンステスト

- Google PageSpeed Insights
- WebPageTest
- Lighthouse（Chrome DevTools）

## 7. 監視設定

### 7.1 Vercel Analytics

1. Analyticsタブで有効化
2. Web Vitalsの監視開始

### 7.2 外部監視（推奨）

#### UptimeRobot設定例
```
Monitor Type: HTTPS
URL: https://yourdomain.com
Check Interval: 5 minutes
Alert Contacts: your-email@example.com
```

#### Sentryの統合
```bash
# Sentryパッケージのインストール
npm install @sentry/nextjs

# 環境変数の追加
SENTRY_DSN=https://xxx@sentry.io/xxx
SENTRY_ENVIRONMENT=production
```

## 8. CI/CD設定

### 8.1 自動デプロイ

Vercelはデフォルトで以下を自動化：
- mainブランチへのpush → 本番環境にデプロイ
- プルリクエスト → プレビューデプロイ

### 8.2 デプロイ保護

1. Settingsタブ → Git
2. "Deployment Protection"を有効化
3. 本番デプロイに承認を要求（オプション）

## 9. トラブルシューティング

### 9.1 ビルドエラー

```bash
# ローカルでビルドテスト
npm run build

# 環境変数の確認
vercel env pull
```

### 9.2 ランタイムエラー

1. Function Logsで確認
2. 環境変数の設定ミスをチェック
3. データベース接続を確認

### 9.3 パフォーマンス問題

- Function実行時間の確認
- データベースクエリの最適化
- 画像の最適化

## 10. メンテナンスとアップデート

### 10.1 アップデート手順

```bash
# 依存関係の更新
npm update

# セキュリティ修正
npm audit fix

# ビルドテスト
npm run build

# GitHubにプッシュ（自動デプロイ）
git add .
git commit -m "Update dependencies"
git push
```

### 10.2 ロールバック

1. Vercel Dashboardでデプロイ履歴を確認
2. 前のデプロイを選択
3. "Promote to Production"をクリック

### 10.3 緊急時の対応

```bash
# 環境変数の即時更新
vercel env add MAINTENANCE_MODE true production

# 特定のデプロイにエイリアス設定
vercel alias set deployment-url custom-alias.vercel.app
```

## 11. 本番運用チェックリスト

### デプロイ前
- [ ] すべてのテストが通過
- [ ] セキュリティ監査完了
- [ ] 環境変数の確認
- [ ] バックアップの確認

### デプロイ後
- [ ] 全機能の動作確認
- [ ] エラーログの監視
- [ ] パフォーマンスメトリクスの確認
- [ ] ユーザーからのフィードバック収集

### 定期メンテナンス
- [ ] 週次: ログの確認
- [ ] 月次: 依存関係の更新
- [ ] 四半期: セキュリティ監査
- [ ] 年次: アーキテクチャレビュー

## 12. サポートとリソース

- [Vercel Documentation](https://vercel.com/docs)
- [Next.js Documentation](https://nextjs.org/docs)
- [MongoDB Atlas Support](https://www.mongodb.com/support)
- [SendGrid Support](https://support.sendgrid.com/)

緊急時の連絡先：
- Vercel Status: https://www.vercel-status.com/
- MongoDB Atlas Status: https://status.cloud.mongodb.com/