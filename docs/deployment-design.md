# 本番環境デプロイ設計書

## 1. アーキテクチャ概要

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   CloudFlare    │────▶│     Vercel      │────▶│ MongoDB Atlas   │
│   (CDN/WAF)     │     │  (Next.js App)  │     │   (Database)    │
└─────────────────┘     └─────────────────┘     └─────────────────┘
         │                       │                        │
         │                       ▼                        │
         │              ┌─────────────────┐              │
         └─────────────▶│    SendGrid     │              │
                        │ (Email Service) │              │
                        └─────────────────┘              │
                                                         │
                        ┌─────────────────┐              │
                        │  Vercel Logs    │◀─────────────┘
                        │  (Monitoring)   │
                        └─────────────────┘
```

## 2. デプロイ前チェックリスト

### 2.1 コードの準備
- [ ] すべてのテストが通過している
- [ ] TypeScriptのビルドエラーがない
- [ ] ESLintエラーがない
- [ ] 本番用の設定が適切
- [ ] 不要なconsole.logが削除されている
- [ ] セキュリティの脆弱性がない（npm audit）

### 2.2 環境変数の準備
- [ ] DATABASE_URL（MongoDB Atlas接続文字列）
- [ ] NEXTAUTH_URL（本番URL）
- [ ] NEXTAUTH_SECRET（強力なランダム文字列）
- [ ] SENDGRID_API_KEY（本番用APIキー）
- [ ] SENDGRID_FROM_EMAIL（送信元メールアドレス）

### 2.3 MongoDB Atlasの準備
- [ ] 本番用クラスターの作成
- [ ] ネットワークアクセス設定
- [ ] データベースユーザーの作成
- [ ] インデックスの作成
- [ ] バックアップ設定

### 2.4 ドメインの準備
- [ ] カスタムドメインの取得
- [ ] DNS設定の準備
- [ ] SSL証明書の確認

## 3. セキュリティ強化設定

### 3.1 Vercelでの環境変数
```
NODE_ENV=production
NEXTAUTH_URL=https://yourdomain.com
NEXTAUTH_SECRET=[32文字以上のランダム文字列]
DATABASE_URL=mongodb+srv://[ユーザー名]:[パスワード]@[クラスター].mongodb.net/[DB名]?retryWrites=true&w=majority
SENDGRID_API_KEY=[本番用APIキー]
SENDGRID_FROM_EMAIL=noreply@yourdomain.com
```

### 3.2 セキュリティヘッダー
Vercelの`vercel.json`で追加設定：
```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "Strict-Transport-Security",
          "value": "max-age=63072000; includeSubDomains; preload"
        },
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "Referrer-Policy",
          "value": "strict-origin-when-cross-origin"
        }
      ]
    }
  ]
}
```

### 3.3 レート制限の強化
本番環境用の設定：
- ログイン: 5回/15分
- 投稿作成: 10回/時間
- API全般: 100回/分

## 4. MongoDB Atlas本番設定

### 4.1 クラスター設定
- **プロバイダー**: AWS
- **リージョン**: 東京（ap-northeast-1）
- **クラスタータイプ**: M10以上（本番推奠）
- **レプリカセット**: 3ノード

### 4.2 セキュリティ設定
1. **ネットワークアクセス**
   - Vercel IPアドレスのホワイトリスト化
   - または、0.0.0.0/0（すべて許可）+ 認証強化

2. **データベースユーザー**
   - 本番用の専用ユーザー作成
   - 最小権限の原則に従う
   - 強力なパスワード使用

3. **接続セキュリティ**
   - SSL/TLS必須
   - 接続文字列に`ssl=true`を含める

### 4.3 パフォーマンス最適化
```javascript
// インデックス作成スクリプト
db.users.createIndex({ email: 1 }, { unique: true })
db.posts.createIndex({ createdAt: -1 })
db.posts.createIndex({ author: 1, createdAt: -1 })
db.auditlogs.createIndex({ timestamp: 1 }, { expireAfterSeconds: 7776000 }) // 90日
db.sessions.createIndex({ expires: 1 }, { expireAfterSeconds: 0 })
```

## 5. Vercelデプロイ設定

### 5.1 ビルド設定
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "framework": "nextjs"
}
```

### 5.2 環境変数の設定
Vercelダッシュボードで設定：
- Production環境用
- Preview環境用（オプション）
- 機密情報は暗号化して保存

### 5.3 ドメイン設定
1. Vercelダッシュボードでドメイン追加
2. DNS設定：
   - Aレコード: 76.76.21.21
   - CNAMEレコード: cname.vercel-dns.com

## 6. 監視とアラート設定

### 6.1 Vercel Analytics
- Web Vitalsの監視
- エラー率の追跡
- パフォーマンスメトリクス

### 6.2 ログ監視
```javascript
// Vercel Functionsログ
// - APIエラー
// - レート制限違反
// - 認証失敗
```

### 6.3 アラート設定
- エラー率が閾値を超えた場合
- レスポンスタイムの悪化
- ビルド失敗

### 6.4 外部監視サービス（推奨）
- **Uptime監視**: UptimeRobot、Pingdom
- **エラー追跡**: Sentry
- **APM**: New Relic、Datadog

## 7. バックアップとリカバリ

### 7.1 MongoDB Atlasバックアップ
- 自動バックアップ: 毎日
- 保持期間: 7日間
- ポイントインタイムリカバリ: 有効

### 7.2 コードバックアップ
- Gitリポジトリ（GitHub/GitLab）
- タグ付けによるリリース管理

## 8. デプロイ後のチェックリスト

### 8.1 機能確認
- [ ] ユーザー登録・ログイン
- [ ] メール送信
- [ ] 投稿の作成・編集・削除
- [ ] 画像アップロード
- [ ] レート制限

### 8.2 セキュリティ確認
- [ ] HTTPSの強制
- [ ] セキュリティヘッダー
- [ ] CSRFトークン
- [ ] 認証フロー

### 8.3 パフォーマンス確認
- [ ] ページロード時間
- [ ] APIレスポンスタイム
- [ ] 画像の最適化

## 9. ロールバック計画

1. **即時ロールバック**
   - Vercelダッシュボードから前のデプロイに戻す

2. **データベースロールバック**
   - MongoDB Atlasのバックアップから復元

3. **緊急時の連絡先**
   - 開発チーム
   - インフラチーム
   - カスタマーサポート

## 10. 継続的な改善

### 10.1 定期的なレビュー
- 週次: エラーログ確認
- 月次: パフォーマンスレビュー
- 四半期: セキュリティ監査

### 10.2 アップデート計画
- 依存関係の更新
- セキュリティパッチ
- 機能改善

### 10.3 スケーリング計画
- トラフィック増加への対応
- データベースのスケールアップ
- CDNの最適化