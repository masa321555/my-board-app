# Yahooメール設定手順

## アプリパスワードの生成

1. **Yahoo! JAPANにログイン**
   - https://mail.yahoo.co.jp にアクセス
   - ログイン

2. **アカウント管理へ移動**
   - 右上のアカウントアイコンをクリック
   - 「アカウント管理」を選択

3. **セキュリティ設定**
   - 「セキュリティ」タブを選択
   - 「アプリパスワード」セクションを探す

4. **アプリパスワードを生成**
   - 「アプリパスワードを生成」をクリック
   - アプリ名を入力: 「会員制掲示板」
   - 「生成」をクリック
   - 生成されたパスワードをコピー（スペースは除去）

## 環境変数の設定

`.env.local`ファイルに以下を設定：

```env
# Yahooメールを使用
EMAIL_PROVIDER=yahoo

# Yahoo設定
YAHOO_USER=あなたのメールアドレス@yahoo.co.jp
YAHOO_APP_PASSWORD=生成されたアプリパスワード（スペースなし）

# 送信者情報
EMAIL_FROM="会員制掲示板 <noreply@あなたのドメイン.com>"
EMAIL_REPLY_TO=support@あなたのドメイン.com
```

## 既存の環境設定（muumuu-mail）との切り替え

現在の設定がmuumuu-mailなどのSMTPサーバーを使用している場合、以下のように切り替えられます：

### muumuu-mail（現在の設定）を使用する場合：
```env
EMAIL_PROVIDER=smtp
MAIL_HOST=myboard321.site
MAIL_PORT=587
MAIL_USER=noreply@myboard321.site
MAIL_PASS=zxcvbnm321
```

### Yahooメールに切り替える場合：
```env
EMAIL_PROVIDER=yahoo
YAHOO_USER=masaharu3210101@yahoo.co.jp
YAHOO_APP_PASSWORD=生成されたアプリパスワード
```

## トラブルシューティング

### エラー: "Invalid login"
- アプリパスワードが正しく設定されているか確認
- パスワードにスペースが含まれていないか確認
- Yahooアカウントのセキュリティ設定を確認

### エラー: "Message rejected"
- 送信元メールアドレス（FROM）がYahooアカウントと一致しているか確認
- Yahooメールの送信制限に達していないか確認

### 送信制限
Yahooメールの制限：
- 1日あたり500通まで
- 1時間あたり100通まで
- 同時接続数: 最大10

## セキュリティ上の注意事項

1. **アプリパスワードの管理**
   - アプリパスワードは通常のパスワードとは別
   - 定期的に更新することを推奨
   - 不要になったアプリパスワードは削除

2. **送信者情報**
   - SPAMと判定されないよう、適切な送信者名を設定
   - Reply-Toアドレスは実在するメールアドレスを使用

3. **本番環境での推奨事項**
   - 大量送信が必要な場合は専用のメールサービス（SendGrid、AWS SES等）の使用を検討
   - 送信ログの記録と監視