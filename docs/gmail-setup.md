# Gmail設定手順

## アプリパスワードの生成（推奨）

1. **Googleアカウントにログイン**
   - https://myaccount.google.com にアクセス

2. **2段階認証を有効化**
   - セキュリティ → 2段階認証プロセス
   - 有効にする

3. **アプリパスワードを生成**
   - セキュリティ → 2段階認証プロセス → アプリパスワード
   - アプリを選択: 「メール」
   - デバイスを選択: 「その他（カスタム名）」
   - 名前を入力: 「会員制掲示板」
   - 生成されたパスワードをコピー

4. **環境変数に設定**
   ```env
   GMAIL_USER=your-email@gmail.com
   GMAIL_APP_PASSWORD=生成されたパスワード（スペースなし）
   ```

## メール送信のテスト

開発環境でメールプレビューを確認：
```
http://localhost:3000/api/email/preview?template=welcome
http://localhost:3000/api/email/preview?template=verification
http://localhost:3000/api/email/preview?template=password-reset
```

## トラブルシューティング

### エラー: "Username and Password not accepted"
- アプリパスワードが正しく設定されているか確認
- 2段階認証が有効になっているか確認
- パスワードにスペースが含まれていないか確認

### エラー: "self signed certificate in certificate chain"
- Node.jsの環境変数に以下を追加：
  ```env
  NODE_TLS_REJECT_UNAUTHORIZED=0
  ```
  （開発環境のみ）

### レート制限エラー
- Gmailの送信制限：
  - 1日あたり500通（個人アカウント）
  - 1日あたり2000通（Google Workspace）
- 環境変数でレート制限を調整：
  ```env
  EMAIL_RATE_LIMIT_PER_HOUR=50
  EMAIL_RATE_LIMIT_PER_DAY=400
  ```

## 本番環境での推奨事項

1. **専用のメールサービスを検討**
   - SendGrid
   - AWS SES
   - Mailgun

2. **送信ドメインの認証**
   - SPFレコード
   - DKIMレコード
   - DMARCポリシー

3. **バウンス処理**
   - 無効なメールアドレスの管理
   - 配信エラーの監視