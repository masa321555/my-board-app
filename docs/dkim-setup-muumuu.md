# DKIM設定ガイド（ムームードメイン）

## 重要なお知らせ

**ムームーメールは現在DKIM署名に対応していません。**

これは多くの格安メールサービスに共通する制限です。

## DKIMが利用できない場合の代替対策

### 1. 現在の設定で十分なケース
すでに以下を設定済みのため、基本的なメール認証は機能しています：
- ✅ **SPFレコード**: 送信元IPアドレスの認証
- ✅ **DMARCレコード**: SPFの結果に基づくポリシー

### 2. メール到達率を向上させる追加対策

#### A. 送信者評価の向上
- 一度に大量のメールを送信しない（1時間100通以内）
- バウンスメールを適切に処理
- 配信停止リクエストに迅速に対応

#### B. メールコンテンツの最適化
- HTMLメールとテキストメールの両方を送信
- 画像とテキストのバランスを保つ
- スパムワードを避ける

#### C. IPウォームアップ
- 新しいドメインは徐々に送信量を増やす
- 最初は1日10通程度から開始

## DKIM対応のメールサービスへの移行

将来的にDKIMが必要になった場合の選択肢：

### 1. SendGrid（推奨）
```javascript
// SendGridでのDKIM自動設定例
const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

// DKIMは自動的に適用される
const msg = {
  to: 'user@example.com',
  from: 'noreply@myboard321.site',
  subject: 'Test Email',
  text: 'Hello World',
};
sgMail.send(msg);
```

料金：月100通まで無料

### 2. Amazon SES
- DKIM自動署名対応
- 料金：$0.10/1000通
- 設定がやや複雑

### 3. Mailgun
- DKIM自動設定
- 料金：月5,000通まで無料（3ヶ月間）

## 現在の認証状態の確認

### メールヘッダーで確認
送信したメールのヘッダーで以下を確認：
```
Authentication-Results: mx.google.com;
       spf=pass (google.com: domain of noreply@myboard321.site designates xxx.xxx.xxx.xxx as permitted sender)
       dmarc=pass (p=NONE sp=NONE dis=NONE) header.from=myboard321.site
```

### オンラインツールで確認
1. mail-tester.com でスコアチェック
2. MXToolbox で認証状態確認

## 移行時期の判断基準

以下の場合はDKIM対応サービスへの移行を検討：

1. **メール到達率が低い**
   - 迷惑メールフォルダに振り分けられる
   - 拒否される頻度が高い

2. **送信量が増加**
   - 月1,000通以上の送信
   - マーケティングメールの送信開始

3. **企業利用**
   - B2Bサービスの提供
   - 金融・医療など信頼性重視の業界

## 現状での推奨事項

1. **SPF + DMARCで運用**
   - 現在の設定で個人・小規模サービスには十分
   - 定期的に到達率をモニタリング

2. **送信量の管理**
   - ムームーメールの制限内で運用
   - 急激な送信量増加を避ける

3. **将来の移行準備**
   - EmailServiceクラスの抽象化
   - 設定の外部化（環境変数）
   - 移行時の影響を最小限に

## まとめ

現時点では：
- ✅ SPFレコード設定済み
- ✅ DMARCレコード設定済み
- ❌ DKIM（ムームーメール非対応）

この状態でも、個人利用や小規模サービスには十分な認証レベルです。
将来的に必要になったら、DKIM対応のメールサービスへの移行を検討してください。