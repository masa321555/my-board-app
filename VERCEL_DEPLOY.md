# Vercelデプロイ手順

## 前提条件

1. Vercelアカウント
2. GitHubリポジトリ
3. MongoDB Atlas（またはMongoDBインスタンス）
4. AWS S3（オプション、アバター画像用）

## デプロイ手順

### 1. Vercelプロジェクトの作成

1. [Vercel](https://vercel.com)にログイン
2. 「New Project」をクリック
3. GitHubリポジトリを選択
4. プロジェクト名を設定

### 2. 環境変数の設定

Vercelダッシュボードで以下の環境変数を設定：

#### 必須環境変数
```
NEXTAUTH_URL=https://your-app.vercel.app
NEXTAUTH_SECRET=your-secret-key-here
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/board_app
```

#### オプション環境変数
```
AWS_REGION=ap-northeast-1
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
S3_BUCKET_NAME=your-s3-bucket-name
SENDGRID_API_KEY=your-sendgrid-api-key
SENDGRID_FROM_EMAIL=noreply@yourdomain.com
NEXT_PUBLIC_APP_NAME=Board App
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
```

### 3. デプロイ設定

- **Framework Preset**: Next.js
- **Build Command**: `npm run build`
- **Output Directory**: `.next`
- **Install Command**: `npm install`

### 4. デプロイ実行

1. 「Deploy」をクリック
2. ビルドが完了するまで待機
3. デプロイが成功したらURLを確認

## トラブルシューティング

### 依存関係エラー

依存関係の競合が発生した場合：

1. `package.json`のバージョンを確認
2. `npm install --legacy-peer-deps`でインストール
3. 必要に応じてパッケージバージョンを調整

### 環境変数エラー

1. すべての必須環境変数が設定されているか確認
2. MongoDB URIが正しい形式か確認
3. NEXTAUTH_URLが本番URLに設定されているか確認

### ビルドエラー

1. TypeScriptエラーを確認
2. ESLintエラーを確認
3. 必要に応じて`next.config.js`でエラーを無視

## 本番環境での注意点

1. **セキュリティ**: 本番環境では強力なNEXTAUTH_SECRETを使用
2. **データベース**: MongoDB Atlasの本番クラスターを使用
3. **ファイルアップロード**: S3またはVercel Blob Storageを使用
4. **メール送信**: SendGridなどの本番メールサービスを使用

## パフォーマンス最適化

1. **画像最適化**: Next.js Imageコンポーネントを使用
2. **キャッシュ**: 適切なキャッシュヘッダーを設定
3. **CDN**: VercelのグローバルCDNを活用
4. **関数タイムアウト**: 必要に応じて関数タイムアウトを調整
