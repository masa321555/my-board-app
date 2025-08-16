# ムームーメール設定ガイド

## 環境変数の設定

`.env`ファイルに以下を設定してください：

```env
# ムームーメール SMTP設定
MAIL_HOST=smtp.muumuu-mail.com
MAIL_PORT=587
MAIL_SECURE=false
MAIL_USER=noreply@yourdomain.com
MAIL_PASS=your-noreply-password

# メールアドレス設定
MAIL_FROM_ADDRESS=noreply@yourdomain.com
MAIL_FROM_NAME=会員制掲示板
MAIL_ADMIN_ADDRESS=admin@yourdomain.com

# アプリケーション設定
APP_URL=https://yourdomain.com
APP_NAME=会員制掲示板
```

## セキュリティ設定

### 1. SPFレコードの設定

ドメインのDNS設定に以下のTXTレコードを追加：

```
v=spf1 include:spf.muumuu-mail.com ~all
```

### 2. 送信ドメイン認証

ムームーメール管理画面から：
1. 「送信ドメイン認証」を選択
2. 対象ドメインを選択
3. 「設定する」をクリック

## メール送信テスト

以下のコードでメール送信をテストできます：

```typescript
import emailService from './src/services/email/emailService';

// 接続テスト
const isConnected = await emailService.testConnection();
if (isConnected) {
  console.log('メールサーバーに接続成功');
}

// テストメール送信
await emailService.sendSystemNotification(
  'test@example.com',
  'テストユーザー',
  'テスト通知',
  'これはテストメールです。'
);
```

## トラブルシューティング

### 接続エラーが発生する場合

1. ファイアウォール設定を確認（ポート587が開いているか）
2. メールアドレスとパスワードが正しいか確認
3. ムームーメールの管理画面でアカウントが有効か確認

### メールが届かない場合

1. 迷惑メールフォルダを確認
2. SPFレコードが正しく設定されているか確認
3. 送信先のメールサーバーでブロックされていないか確認

## 注意事項

- `noreply`アドレスは送信専用として使用
- パスワードは定期的に変更することを推奨
- 大量送信する場合は、送信制限に注意（1時間あたり100通程度）
- 本番環境では、より高性能なメール送信サービス（SendGrid等）への移行を検討