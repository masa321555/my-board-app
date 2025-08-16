# セキュリティテストガイド

## 概要

このドキュメントでは、実装されたセキュリティ対策のテスト方法について説明します。

## テストツール

### 1. 自動セキュリティテスト
完全な自動テストスイートで、すべてのセキュリティ機能をテストします。

```bash
# 依存関係のインストール
npm install axios jsdom isomorphic-dompurify

# テストの実行
node scripts/test-security.js
```

テスト項目：
- レート制限（5リクエスト/分）
- XSS防御
- CSRF保護
- セキュリティヘッダー
- 入力値検証
- 監査ログ

### 2. クイックセキュリティチェック
基本的なセキュリティチェックを素早く実行します。

```bash
# 実行権限の付与（初回のみ）
chmod +x scripts/security-quick-test.sh

# テストの実行
./scripts/security-quick-test.sh

# カスタムURLでの実行
./scripts/security-quick-test.sh https://your-domain.com
```

チェック項目：
- npm脆弱性スキャン
- セキュリティヘッダーの存在確認
- レート制限の基本動作
- ログディレクトリのサイズ
- 環境変数の設定確認

### 3. 手動テストガイド
`scripts/test-security-manual.md`に詳細な手動テスト手順があります。

## テスト環境の準備

1. **開発サーバーの起動**
   ```bash
   npm run dev
   ```

2. **テストユーザーの作成**
   - http://localhost:3000/auth/register でアカウント作成
   - テスト用のメールアドレスとパスワードを使用

3. **MongoDB接続の確認**
   ```bash
   # MongoDBが起動していることを確認
   mongosh
   ```

## 各セキュリティ機能のテスト詳細

### レート制限テスト

**目的**: APIエンドポイントへの過剰なリクエストを防ぐ

**テスト方法**:
1. 1分間に6回以上の投稿作成を試みる
2. 5回目まで成功、6回目で429エラーを確認
3. レスポンスヘッダーを確認：
   - `X-RateLimit-Limit`
   - `X-RateLimit-Reset`
   - `Retry-After`

### XSS防御テスト

**目的**: 悪意のあるスクリプトの実行を防ぐ

**テストペイロード**:
```javascript
// タイトル
<script>alert('XSS')</script>

// 本文
<img src=x onerror="alert('XSS')">
<a href="javascript:alert('XSS')">Click</a>
```

**確認事項**:
- スクリプトが実行されない
- HTMLタグが適切にサニタイズされる

### CSRF防御テスト

**目的**: クロスサイトリクエストフォージェリを防ぐ

**テスト方法**:
1. 開発者ツールでリクエストヘッダーを確認
2. `X-CSRF-Token`の存在を確認
3. トークンなしでAPIを呼び出し、403エラーを確認

### セキュリティヘッダーテスト

**確認すべきヘッダー**:
- `X-Frame-Options: DENY` - クリックジャッキング防止
- `X-Content-Type-Options: nosniff` - MIMEスニッフィング防止
- `X-XSS-Protection: 1; mode=block` - XSS防御
- `Content-Security-Policy` - コンテンツ制限
- `Referrer-Policy: strict-origin-when-cross-origin` - リファラー制御

### 入力値検証テスト

**テストケース**:
- 空の入力
- 文字数超過（タイトル: 101文字、本文: 1001文字）
- 特殊文字
- SQLインジェクションペイロード
- NoSQLインジェクションペイロード

### 監査ログテスト

**ログ記録されるイベント**:
- ユーザー認証（成功/失敗）
- レート制限違反
- 不正アクセス試行
- CRUD操作

**確認方法**:
```bash
# MongoDBで確認
use your-database
db.auditlogs.find().sort({timestamp: -1}).limit(10)

# ログファイルで確認
tail -f logs/security.log
```

## トラブルシューティング

### よくある問題

1. **レート制限が機能しない**
   - Redisまたはインメモリキャッシュの確認
   - middleware.tsの設定確認

2. **CSRFトークンエラー**
   - Cookieの確認
   - セッションの有効性確認

3. **セキュリティヘッダーが表示されない**
   - ミドルウェアの適用パス確認
   - next.config.jsの設定確認

## セキュリティチェックリスト

定期的に以下を確認：

- [ ] `npm audit`で脆弱性チェック
- [ ] 依存関係の更新
- [ ] ログファイルのサイズとローテーション
- [ ] 監査ログの保存期間（90日）
- [ ] セッションの有効期限設定
- [ ] 本番環境でのHTTPS設定
- [ ] 環境変数の適切な管理

## 本番環境での追加考慮事項

1. **WAF（Web Application Firewall）の導入**
2. **DDoS対策**
3. **セキュリティモニタリングツール**
4. **定期的なペネトレーションテスト**
5. **セキュリティインシデント対応計画**