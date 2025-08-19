# メール送信機能修正ログ - 2025-08-19 22:11:36

## 問題の概要

### ユーザー報告
- 新規登録時にメール送信が失敗し、APIが202ステータス（emailSent: false）を返している
- ユーザーには登録は成功するが、確認メールが届かない
- 環境変数エラー（503）は解決済みだが、メール送信機能が動作しない

### 根本原因
1. 環境変数が設定されていない場合、ダミートランスポーターが成功したかのような応答を返していた
2. エラーの詳細がクライアントに適切に伝わっていなかった
3. SendGridなどの代替プロバイダーのサポートが不足していた

## 実施した修正

### 1. メール設定エラーの明確化

#### /src/lib/email/client.ts
- `EmailConfigurationError`クラスを新規作成
- ダミートランスポーターがエラーを投げるように変更（silent failからexplicit failへ）
- SendGridプロバイダーのサポートを追加

```typescript
export class EmailConfigurationError extends Error {
  constructor(message: string, public context: string) {
    super(message);
    this.name = 'EmailConfigurationError';
  }
}
```

### 2. エラーハンドリングの改善

#### /src/lib/email/service.ts
- 詳細なエラー情報をログに記録
- エラーコードを判定して適切なコードを返す
  - `EMAIL_CONFIG_ERROR`: 設定エラー
  - `EMAIL_HOST_NOT_FOUND`: ホストが見つからない
  - `EMAIL_AUTH_FAILED`: 認証失敗
  - `EMAIL_INVALID_RECIPIENT`: 無効な受信者
  - `EMAIL_RECIPIENT_REJECTED`: 受信者拒否

```typescript
if (error instanceof EmailConfigurationError) {
  return {
    success: false,
    error: error.message,
    code: 'EMAIL_CONFIG_ERROR',
  };
}
```

### 3. レスポンスステータスの適切化

#### /app/api/auth/register/route.ts
- メール設定エラーの場合は500を返す（以前は常に202）
- エラーコードをレスポンスに含める

```typescript
if (emailError.code === 'EMAIL_CONFIG_ERROR') {
  return errorResponse(
    'メール送信の設定に問題があります。管理者にお問い合わせください。',
    'EMAIL_SERVICE_UNAVAILABLE',
    500,
    {
      requiresEmailVerification: true,
      emailSent: false,
      emailError: emailError.code
    }
  );
}
```

### 4. プレーンテキストメールのサポート

#### /src/lib/email/service.ts
- `EMAIL_USE_PLAIN_TEXT=true`でプレーンテキストメールを送信
- 最小限のテキストテンプレートを実装
- HTMLメールで問題がある場合のフォールバック

### 5. メールヘルスチェックエンドポイント

#### /app/api/health/email/route.ts
- メール設定の状態を確認できるエンドポイント
- 接続テストを実行
- 設定の問題を事前に検出可能

### 6. SendGridサポートの追加

```typescript
case 'sendgrid':
  transporter = nodemailer.createTransport({
    host: 'smtp.sendgrid.net',
    port: 587,
    secure: false,
    auth: {
      user: 'apikey',
      pass: sendgridApiKey,
    },
  });
  break;
```

## Vercelでの環境変数設定

### 必須設定（いずれか一つ）

#### SMTP設定
```
EMAIL_PROVIDER=smtp
MAIL_HOST=your-smtp-host.com
MAIL_PORT=587
MAIL_USER=your-email@domain.com
MAIL_PASS=your-password
EMAIL_FROM=noreply@yourdomain.com
```

#### SendGrid設定
```
EMAIL_PROVIDER=sendgrid
SENDGRID_API_KEY=SG.xxxxxxxxxxxxxxxxxxxxx
EMAIL_FROM=noreply@yourdomain.com
```

#### 開発/テスト用（Ethereal）
```
EMAIL_PROVIDER=ethereal
```

### オプション設定
```
EMAIL_USE_PLAIN_TEXT=true  # プレーンテキストメールを使用
```

## デバッグ方法

1. **ヘルスチェック**
   ```
   GET /api/health/email
   ```
   メール設定の状態と接続テスト結果を確認

2. **プレーンテキストモード**
   環境変数に`EMAIL_USE_PLAIN_TEXT=true`を設定して、HTMLメールの問題を回避

3. **エラーログの確認**
   詳細なエラー情報がサーバーログに記録されるようになった

## テスト結果
- ビルドテスト: ✅ 成功
- TypeScriptエラー: ✅ 修正済み
- mainブランチへのマージ: ✅ 完了
- GitHubへのプッシュ: ✅ 完了

## 今後の推奨事項

1. **Vercel環境変数の設定**
   - Project Settings > Environment Variables でメール設定を追加
   - Production/Preview/Developmentすべてに設定
   - 設定後、再デプロイが必要

2. **メールプロバイダーの選択**
   - SendGrid: 高い配信率、API統合が容易
   - SMTP: 既存のメールサーバーを利用可能
   - Ethereal: 開発環境でのテスト用

3. **ドメイン認証**
   - SPF/DKIM設定でメール配信率を向上
   - SendGridの場合はSender Verification必須

4. **再送機能の実装**
   - `/api/auth/resend-verification`エンドポイントの実装
   - トークンの再利用または再発行ロジック

## 関連ファイル
- /src/lib/email/client.ts
- /src/lib/email/service.ts
- /src/types/email.ts
- /app/api/auth/register/route.ts
- /app/api/health/email/route.ts