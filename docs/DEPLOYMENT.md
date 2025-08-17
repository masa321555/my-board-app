# Vercelデプロイメントガイド

## 必須環境変数

Vercelのダッシュボードで以下の環境変数を設定してください：

### 1. データベース設定
- `MONGODB_URI`: MongoDB Atlasの接続文字列
  - 例: `mongodb+srv://username:password@cluster.mongodb.net/board_db?retryWrites=true&w=majority`

### 2. 認証設定
- `NEXTAUTH_SECRET`: NextAuth用のシークレットキー
  - 生成方法: `openssl rand -base64 32`
- `JWT_SECRET`: JWT用のシークレットキー
  - 生成方法: `openssl rand -base64 32`

### 3. アプリケーションURL
- `APP_URL`: アプリケーションのURL（オプション）
  - 例: `https://your-app.vercel.app`
  - 注: Vercelは自動的に`VERCEL_URL`を設定するため、省略可能

## オプション環境変数

### メール送信設定
メール送信機能を使用する場合のみ設定してください。設定しない場合、メール送信は無効になりますが、アプリケーションは正常に動作します。

#### SMTP設定
```
EMAIL_PROVIDER=smtp
MAIL_HOST=smtp.example.com
MAIL_PORT=587
MAIL_USER=your-email@example.com
MAIL_PASS=your-email-password
```

#### Gmail設定
```
EMAIL_PROVIDER=gmail
GMAIL_USER=your-gmail@gmail.com
GMAIL_APP_PASSWORD=your-app-specific-password
```

#### Yahoo設定
```
EMAIL_PROVIDER=yahoo
YAHOO_USER=your-yahoo@yahoo.com
YAHOO_APP_PASSWORD=your-app-specific-password
```

## デプロイ手順

1. **リポジトリをVercelに接続**
   - GitHubリポジトリをVercelに接続します

2. **環境変数を設定**
   - Vercelダッシュボード > Settings > Environment Variables
   - 上記の必須環境変数を追加

3. **ビルド設定**
   - Framework Preset: Next.js
   - Build Command: デフォルトのまま
   - Output Directory: デフォルトのまま

4. **デプロイ**
   - Deployボタンをクリック

## トラブルシューティング

### ビルドエラーが発生する場合
1. package-lock.jsonがコミットされているか確認
2. Node.jsバージョンを確認（18.x以上推奨）

### 500エラーが発生する場合
1. 環境変数が正しく設定されているか確認
2. MongoDB接続文字列が正しいか確認
3. Function Logsでエラー詳細を確認

### メール送信が機能しない場合
- メール設定はオプションです
- 設定しない場合、登録確認メールは送信されませんが、開発環境と同様にメール確認なしで登録が完了します

## セキュリティ注意事項

1. **シークレットキーの管理**
   - NEXTAUTH_SECRETとJWT_SECRETは必ず強力なランダム文字列を使用
   - 定期的に更新することを推奨

2. **環境変数の保護**
   - 本番環境の環境変数は絶対にコードにハードコーディングしない
   - .envファイルはgitignoreに含める

3. **CORS設定**
   - 必要に応じてCORS設定を調整

## パフォーマンス最適化

1. **MongoDB接続**
   - connection poolingが自動的に有効
   - Vercelのサーバーレス環境に最適化済み

2. **画像最適化**
   - Next.js Image componentを使用
   - 自動的に最適化される