# 本番デプロイチェックリスト

## 🚀 デプロイ前の確認事項

### 1. 環境変数の設定

- [ ] `.env.production.local`ファイルを作成
  ```bash
  node scripts/generate-production-env.js
  ```

- [ ] 必須環境変数の設定確認
  - [ ] `NEXTAUTH_SECRET` - 32文字以上のランダム文字列
  - [ ] `DATABASE_URL` - MongoDB Atlas接続文字列
  - [ ] `SENDGRID_API_KEY` - SendGrid APIキー
  - [ ] `SENDGRID_FROM_EMAIL` - 認証済みドメインのメールアドレス

### 2. コード品質チェック

- [ ] 自動チェックスクリプトの実行
  ```bash
  ./scripts/production-checklist.sh
  ```

- [ ] 手動確認項目
  - [ ] console.logの削除
  - [ ] デバッグコードの削除
  - [ ] TODOコメントの確認
  - [ ] 未使用のインポートの削除

### 3. セキュリティ確認

- [ ] セキュリティ監査
  ```bash
  npm audit --production
  npm audit fix --production
  ```

- [ ] セキュリティヘッダーの確認
  - [ ] vercel.jsonに設定済み
  - [ ] CSPの本番環境設定
  - [ ] HSTSの有効化

### 4. パフォーマンス最適化

- [ ] ビルド最適化
  ```bash
  npm run build:production
  ```

- [ ] バンドルサイズの確認
  ```bash
  npm run analyze
  ```

- [ ] 画像最適化の確認
  - [ ] next/imageの使用
  - [ ] 適切なフォーマット（WebP/AVIF）

### 5. MongoDB Atlas設定

- [ ] 本番クラスターの作成
- [ ] ネットワークアクセスの設定
- [ ] インデックスの作成
  ```javascript
  // 必須インデックス
  db.users.createIndex({ email: 1 }, { unique: true })
  db.posts.createIndex({ createdAt: -1 })
  db.sessions.createIndex({ expires: 1 }, { expireAfterSeconds: 0 })
  db.auditlogs.createIndex({ timestamp: 1 }, { expireAfterSeconds: 7776000 })
  ```

- [ ] バックアップ設定の確認

### 6. Vercel設定

- [ ] プロジェクトの作成/インポート
- [ ] 環境変数の設定（Vercelダッシュボード）
- [ ] リージョンの設定（東京: nrt1）
- [ ] ドメインの設定

### 7. エラー監視（Sentry）

- [ ] Sentryプロジェクトの作成
- [ ] DSNの取得と設定
- [ ] ソースマップのアップロード設定
- [ ] アラート設定

### 8. テスト実行

- [ ] 単体テスト
  ```bash
  npm test
  ```

- [ ] セキュリティテスト
  ```bash
  node scripts/test-security.js
  ```

- [ ] E2Eテスト（オプション）
  ```bash
  npm run test:e2e
  ```

### 9. Git準備

- [ ] すべての変更をコミット
- [ ] タグの作成
  ```bash
  git tag -a v1.0.0 -m "Production release v1.0.0"
  git push origin v1.0.0
  ```

### 10. デプロイ実行

- [ ] Vercelへプッシュ
  ```bash
  git push origin main
  ```

- [ ] デプロイの監視
- [ ] ビルドログの確認

## 🔍 デプロイ後の確認

### 1. 機能テスト

- [ ] ユーザー登録・ログイン
- [ ] メール送信（確認メール）
- [ ] 投稿の作成・編集・削除
- [ ] 画像アップロード
- [ ] レート制限の動作

### 2. セキュリティ確認

- [ ] HTTPSの強制
- [ ] セキュリティヘッダーの確認
  ```bash
  curl -I https://your-domain.com
  ```

- [ ] CSRFトークンの動作
- [ ] XSS防御の確認

### 3. パフォーマンス確認

- [ ] [PageSpeed Insights](https://pagespeed.web.dev/)でスコア確認
- [ ] Core Web Vitalsの確認
- [ ] 初回ロード時間の測定

### 4. 監視設定

- [ ] Vercel Analyticsの有効化
- [ ] Sentryでエラーが記録されるか確認
- [ ] アップタイム監視の設定（UptimeRobot等）

### 5. バックアップ確認

- [ ] MongoDB Atlasの自動バックアップ
- [ ] 手動バックアップのテスト
- [ ] リストア手順の確認

## 📋 定期メンテナンス

### 週次
- [ ] エラーログの確認
- [ ] パフォーマンスメトリクスの確認
- [ ] セキュリティアラートの確認

### 月次
- [ ] 依存関係の更新
  ```bash
  npm update
  npm audit fix
  ```
- [ ] 未使用インデックスの確認
- [ ] ストレージ使用量の確認

### 四半期
- [ ] セキュリティ監査
- [ ] パフォーマンスレビュー
- [ ] アーキテクチャレビュー

## 🚨 緊急時の対応

### ロールバック手順
1. Vercelダッシュボードで前のデプロイメントを選択
2. "Promote to Production"をクリック
3. 5分以内に自動ロールバック完了

### 緊急連絡先
- 開発責任者: 
- インフラ担当: 
- セキュリティ担当: 

### インシデント対応
1. 影響範囲の特定
2. 一時的な対策（メンテナンスモード等）
3. 根本原因の調査
4. 恒久対策の実施
5. ポストモーテムの作成