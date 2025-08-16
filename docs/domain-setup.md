# ドメイン設定ガイド - myboard321.site

## 1. ドメイン登録

### さくらインターネットでの登録
1. https://domain.sakura.ad.jp/ にアクセス
2. 「myboard321.site」を検索
3. カートに追加して購入手続き
4. WHOISプロキシサービスを有効化（個人情報保護）

### 料金目安
- 初年度: 500-1,500円
- 更新料: 2,000-4,000円/年

## 2. DNS設定

### Vercelを使用する場合
```
A     @     76.76.21.21
CNAME www   cname.vercel-dns.com
```

### さくらのレンタルサーバーを使用する場合
```
NS    ns1.dns.ne.jp
NS    ns2.dns.ne.jp
```

## 3. メール設定

### メールアドレス例
- info@myboard321.site（お問い合わせ）
- admin@myboard321.site（管理者）
- support@myboard321.site（サポート）
- noreply@myboard321.site（送信専用）

### メールサーバー設定（さくら）
- 受信: myboard321.site（IMAP: 993）
- 送信: myboard321.site（SMTP: 587）
- 暗号化: STARTTLS

### メール認証（SPF）
```
TXT  @  "v=spf1 include:_spf.sakura.ne.jp ~all"
```

## 4. SSL証明書

- Vercel/Netlify: 自動設定
- さくらサーバー: Let's Encrypt（無料）

## 5. 環境変数の更新

`.env.local`に追加:
```env
NEXT_PUBLIC_DOMAIN=https://myboard321.site
MAIL_FROM=noreply@myboard321.site
```

## チェックリスト

- [ ] ドメイン購入完了
- [ ] DNS設定完了
- [ ] SSL証明書有効
- [ ] メールアドレス作成
- [ ] SPFレコード設定
- [ ] 環境変数更新
- [ ] 動作確認