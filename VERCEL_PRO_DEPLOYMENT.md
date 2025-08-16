# Vercel Proプラン デプロイメントガイド

## 1. Vercelプロジェクトの作成

1. [Vercel Dashboard](https://vercel.com/dashboard)にアクセス
2. "New Project"をクリック
3. GitHubリポジトリを選択:
   - Repository: `my-board-app`
   - Branch: `main`
4. "Import"をクリック

## 2. 環境変数の設定

以下の環境変数をVercelプロジェクトに設定してください：

### 必須の環境変数

```env
# データベース
MONGODB_URI=your_mongodb_atlas_connection_string

# NextAuth設定
NEXTAUTH_URL=https://www.myboard321.site
NEXTAUTH_SECRET=your_nextauth_secret_here

# メール設定（以下のいずれか1つを選択）

# オプション1: Gmail
EMAIL_PROVIDER=gmail
GMAIL_USER=your-email@gmail.com
GMAIL_APP_PASSWORD=your-app-password

# オプション2: Yahoo
EMAIL_PROVIDER=yahoo
YAHOO_USER=your-email@yahoo.com
YAHOO_APP_PASSWORD=your-app-password

# オプション3: SMTP（Muumuu Mail等）
EMAIL_PROVIDER=smtp
MAIL_HOST=smtp.muumuu-mail.com
MAIL_PORT=587
MAIL_USER=info@myboard321.site
MAIL_PASS=your-smtp-password
MAIL_SECURE=false

# メール送信元
EMAIL_FROM="会員制掲示板 <noreply@myboard321.site>"

# セッション設定
SESSION_SECRET=your_session_secret_here

# レート制限
EMAIL_RATE_LIMIT_PER_HOUR=100
```

### 環境変数の生成方法

```bash
# シークレットキーの生成
npm run generate-secrets

# 生成されたキーを上記の環境変数にコピー
```

## 3. デプロイメント設定

### Framework Preset
- **Framework**: Next.js
- **Build Command**: `npm run build`
- **Output Directory**: `.next`
- **Install Command**: `npm install --production=false`

### リージョン設定
- **Region**: Tokyo, Japan (hnd1)

## 4. カスタムドメインの設定

1. Vercelプロジェクトの"Settings" → "Domains"へ移動
2. "Add"をクリック
3. `www.myboard321.site`を入力
4. DNSレコードの設定:
   ```
   Type: CNAME
   Name: www
   Value: cname.vercel-dns.com
   ```

## 5. デプロイの実行

```bash
# 最新の変更をプッシュ
git add .
git commit -m "feat: Vercel Pro deployment configuration"
git push origin main
```

## 6. デプロイの確認

1. Vercelダッシュボードでビルドログを確認
2. デプロイが成功したら、以下のURLでアクセス可能:
   - Vercel URL: `https://your-project.vercel.app`
   - カスタムドメイン: `https://www.myboard321.site`

## トラブルシューティング

### ビルドエラーが発生した場合

1. ビルドログを確認
2. 環境変数が正しく設定されているか確認
3. `npm run build`をローカルで実行してエラーがないか確認

### デプロイが開始されない場合

1. Git接続を確認
2. デプロイフックを使用して手動でトリガー:
   ```bash
   # scripts/force-deploy.shを編集してDeploy Hook URLを設定
   ./scripts/force-deploy.sh
   ```

### パフォーマンスの最適化

Vercel Proプランの機能を活用:
- **Edge Functions**: より高速なレスポンス
- **Analytics**: パフォーマンス監視
- **Web Vitals**: ユーザー体験の測定