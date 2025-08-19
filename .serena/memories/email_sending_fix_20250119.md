# メール送信機能修正 - 2025-01-19

## 問題の概要
- 新規登録時にメール送信が失敗し、APIが202ステータス（emailSent: false）を返している
- 環境変数が未設定の場合でも、エラーが適切に返されない

## 根本原因
1. ダミートランスポーターがsilent failで成功したかのような応答を返していた
2. メール設定エラーの詳細がクライアントに伝わっていなかった
3. SendGrid等の代替プロバイダーサポートが不足

## 実施した修正

### 1. メール設定エラーの明確化
#### /src/lib/email/client.ts
- `EmailConfigurationError`クラスを作成
- ダミートランスポーターがエラーを投げるように変更
- SendGridプロバイダーのサポートを追加

### 2. エラーハンドリングの改善
#### /src/lib/email/service.ts
- 詳細なエラーコードを返す
  - EMAIL_CONFIG_ERROR: 設定エラー
  - EMAIL_HOST_NOT_FOUND: ホスト未発見
  - EMAIL_AUTH_FAILED: 認証失敗
  - EMAIL_INVALID_RECIPIENT: 無効な受信者
  - EMAIL_RECIPIENT_REJECTED: 受信者拒否

### 3. レスポンスステータスの適切化
#### /app/api/auth/register/route.ts
- メール設定エラーの場合は500を返す
- それ以外のメール送信失敗は202を返す

### 4. プレーンテキストメールのサポート
- EMAIL_USE_PLAIN_TEXT=trueでプレーンテキストメールを送信
- HTMLメールで問題がある場合のフォールバック

### 5. メールヘルスチェックエンドポイント
#### /app/api/health/email/route.ts
- メール設定の状態確認
- 接続テストの実行

## Vercel環境変数設定（必須）

### SMTP設定
```
EMAIL_PROVIDER=smtp
MAIL_HOST=smtp.example.com
MAIL_PORT=587
MAIL_USER=user@example.com
MAIL_PASS=password
EMAIL_FROM=noreply@example.com
```

### SendGrid設定
```
EMAIL_PROVIDER=sendgrid
SENDGRID_API_KEY=SG.xxxxx
EMAIL_FROM=noreply@example.com
```

### 開発環境（Ethereal）
```
EMAIL_PROVIDER=ethereal
```

## 関連ファイル
- /src/lib/email/client.ts
- /src/lib/email/service.ts
- /src/types/email.ts
- /app/api/auth/register/route.ts
- /app/api/health/email/route.ts

## ログファイル
- /log/email-sending-fix-2025-08-19-2211.md