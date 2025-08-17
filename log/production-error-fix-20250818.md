# 本番環境登録エラー修正ログ - 2025-08-18

## 問題
本番環境（Vercel）で新規ユーザー登録時に500 Internal Server Errorが発生

## エラー内容
```
POST https://my-board-app-peach.vercel.app/api/auth/register 500 (Internal Server Error)
APIレスポンス内容: {error: 'ユーザー登録に失敗しました'}
```

## 原因分析
1. 環境変数の未設定によるエラー
   - MONGODB_URI
   - JWT_SECRET
   - メール関連の環境変数

2. メールサービスの初期化エラー
   - EMAIL_PROVIDER、MAIL_HOST等が未設定の場合にエラーをスロー

3. APP_URL環境変数の未設定

## 実施した修正

### 1. エラーハンドリングの改善
**ファイル**: `/app/api/auth/register/route.ts`
- 詳細なエラーログの追加
- エラータイプの判定と適切なメッセージ返却
- 環境変数の設定状態をログ出力

### 2. メールサービスのグレースフルフォールバック
**ファイル**: `/src/lib/email/client.ts`
- メール設定がない場合はダミートランスポーターを返す
- エラーをスローする代わりにコンソールに警告を出力
- メール送信機能を無効化しても登録は成功するように変更

### 3. MongoDB接続エラーハンドリング
**ファイル**: `/src/lib/db.ts`
- MONGODB_URIが未設定の場合の適切なエラーメッセージ
- 接続エラーの詳細なログ出力

### 4. APP_URLのフォールバック
**ファイル**: `/app/api/auth/register/route.ts`
- VERCEL_URL環境変数を使用したフォールバック
- デフォルト値の設定

## 必要な環境変数設定（Vercelダッシュボード）

### 必須
```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database-name
JWT_SECRET=<openssl rand -base64 32で生成>
NEXTAUTH_SECRET=<openssl rand -base64 32で生成>
```

### オプション（メール送信を使用する場合）
```
EMAIL_PROVIDER=smtp
MAIL_HOST=smtp.example.com
MAIL_PORT=587
MAIL_USER=your-email@example.com
MAIL_PASS=your-password
```

## デプロイ手順
1. 上記の必須環境変数をVercelダッシュボードで設定
2. 再デプロイを実行
3. Function Logsでエラーの詳細を確認

## メリット
- メール設定なしでもアプリケーションが動作
- より詳細なエラーログで問題の特定が容易
- 段階的な機能追加が可能（まずは基本機能、後でメール機能）