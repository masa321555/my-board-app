# Claude用プロジェクト情報

## プロジェクト概要
- 会員制掲示板アプリケーション
- Next.js 15.4.5 + TypeScript + MongoDB

## 重要な注意事項

### 1. パスワードフィールドのブロック問題
一部のブラウザ拡張機能（パスワードマネージャー等）やセキュリティソフトが、HTTPリクエストのパスワードフィールドを `password: "actual_value"` から `passwordLength: 12` に変換することがあります。

この問題への対処：
- サーバー側で`passwordLength`フィールドを検出し、適切なエラーメッセージを返す
- ユーザーには拡張機能の一時無効化を推奨
- 代替手段として、FormData形式での送信も検討

### 2. ビルド時の確認事項
```bash
# ビルドテスト
npm run build

# TypeScriptチェック
npm run type-check

# Lintチェック
npm run lint
```

### 3. 環境変数
必須の環境変数：
- MONGODB_URI
- JWT_SECRET
- NEXTAUTH_SECRET

メール送信関連（オプション）：
- EMAIL_PROVIDER (smtp/gmail/yahoo/ethereal)
- MAIL_HOST, MAIL_PORT, MAIL_USER, MAIL_PASS (SMTP用)

### 4. CSR（Client-Side Rendering）互換性
Vercelデプロイ時の注意：
- 'use client'ディレクティブを適切に使用
- 動的インポートの使用を検討
- サーバーサイドでのみ動作するコード（bcrypt、nodemailer等）は必ずAPI Routeで使用

### 5. デバッグ用エンドポイント
- `/auth/register-test` - 登録機能のテストページ（JSON/FormData両方のテスト可能）

## よくある問題と解決方法

### 登録エラー「ユーザー登録に失敗しました」
1. ブラウザのDevToolsでNetworkタブを確認
2. リクエストペイロードに`passwordLength`が含まれている場合、ブラウザ拡張機能が原因
3. 拡張機能を無効化するか、シークレットモードで試す

### メールが送信されない
1. `.env.local`でメール設定を確認
2. 開発環境では`EMAIL_PROVIDER=ethereal`を使用可能
3. 本番環境では実際のSMTP設定が必要