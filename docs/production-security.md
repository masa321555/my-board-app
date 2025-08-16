# 本番環境セキュリティ設定ガイド

## 1. アプリケーションレベルのセキュリティ

### 1.1 レート制限（本番環境設定）

```javascript
// 本番環境のレート制限設定
{
  createPost: {
    windowMs: 3600000,  // 1時間
    max: 10,            // 10回まで
  },
  updatePost: {
    windowMs: 3600000,  // 1時間  
    max: 30,            // 30回まで
  },
  login: {
    windowMs: 900000,   // 15分
    max: 5,             // 5回まで
  },
  sendEmail: {
    windowMs: 86400000, // 24時間
    max: 10,            // 10回まで
  },
  general: {
    windowMs: 60000,    // 1分
    max: 100,           // 100回まで
  }
}
```

### 1.2 セキュリティヘッダー（Vercel設定）

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
          "key": "X-XSS-Protection",
          "value": "1; mode=block"
        },
        {
          "key": "Referrer-Policy",
          "value": "strict-origin-when-cross-origin"
        },
        {
          "key": "Permissions-Policy",
          "value": "camera=(), microphone=(), geolocation=()"
        }
      ]
    }
  ]
}
```

### 1.3 Content Security Policy (CSP)

本番環境用のCSP設定：

```javascript
const cspProduction = {
  'default-src': ["'self'"],
  'script-src': [
    "'self'",
    "'unsafe-inline'",  // Next.jsのインラインスクリプト用
    "'unsafe-eval'",    // 開発ツール用（本番では削除を検討）
    "https://vercel.live",
    "https://www.googletagmanager.com",
  ],
  'style-src': [
    "'self'",
    "'unsafe-inline'",  // MUIのインラインスタイル用
    "https://fonts.googleapis.com",
  ],
  'img-src': [
    "'self'",
    "data:",
    "blob:",
    "https:",
  ],
  'font-src': [
    "'self'",
    "https://fonts.gstatic.com",
  ],
  'connect-src': [
    "'self'",
    "https://api.sendgrid.com",
    "wss://",  // WebSocket接続用
  ],
  'frame-ancestors': ["'none'"],
  'base-uri': ["'self'"],
  'form-action': ["'self'"],
};
```

## 2. 認証とセッション管理

### 2.1 NextAuth本番設定

```javascript
// 本番環境のセッション設定
{
  session: {
    strategy: 'jwt',
    maxAge: 7 * 24 * 60 * 60,  // 7日
    updateAge: 24 * 60 * 60,    // 24時間
  },
  jwt: {
    maxAge: 7 * 24 * 60 * 60,   // 7日
  },
  cookies: {
    sessionToken: {
      name: '__Secure-next-auth.session-token',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: true,
        maxAge: 604800,  // 7日
      },
    },
  },
}
```

### 2.2 パスワードポリシー

- 最小8文字
- 大文字・小文字・数字・特殊文字を含む（推奨）
- 過去のパスワードの再使用禁止（実装検討）
- パスワード有効期限（90日推奨）

## 3. データベースセキュリティ

### 3.1 MongoDB Atlas設定

#### ネットワークアクセス
```
# Vercel IPアドレス（定期的に確認が必要）
# または Atlas Private Endpointの使用を検討
```

#### 接続文字列のセキュリティ
```
mongodb+srv://username:password@cluster.mongodb.net/database?
  retryWrites=true&
  w=majority&
  ssl=true&
  authSource=admin&
  replicaSet=atlas-xxxxx-shard-0
```

#### ユーザー権限
```javascript
// 最小権限の原則
{
  "role": "readWrite",
  "db": "production-database"
}
```

### 3.2 データ暗号化

- **転送中の暗号化**: TLS/SSL（必須）
- **保存時の暗号化**: MongoDB Atlas Encryption at Rest
- **フィールドレベル暗号化**: 機密データ用（PII情報など）

## 4. API セキュリティ

### 4.1 CORS設定

```javascript
// Next.js API Routeでの設定
const corsHeaders = {
  'Access-Control-Allow-Origin': process.env.NEXT_PUBLIC_APP_URL,
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-CSRF-Token',
  'Access-Control-Allow-Credentials': 'true',
};
```

### 4.2 入力検証とサニタイゼーション

```javascript
// 厳格な入力検証
{
  title: {
    type: 'string',
    minLength: 1,
    maxLength: 100,
    pattern: '^[\\p{L}\\p{N}\\s\\p{P}]+$',  // Unicode対応
  },
  content: {
    type: 'string',
    minLength: 1,
    maxLength: 1000,
    sanitize: true,  // DOMPurify使用
  },
}
```

## 5. 監査とログ

### 5.1 監査ログの実装

```javascript
// 記録すべきイベント
{
  authentication: {
    login: { success: true, failed: true },
    logout: true,
    passwordChange: true,
  },
  authorization: {
    accessDenied: true,
    privilegeEscalation: true,
  },
  dataAccess: {
    create: true,
    read: false,  // パフォーマンスを考慮
    update: true,
    delete: true,
  },
  security: {
    rateLimitExceeded: true,
    suspiciousActivity: true,
    configChange: true,
  },
}
```

### 5.2 ログの保護

- ログファイルへのアクセス制限
- ログの改ざん防止（チェックサム）
- 定期的なログのアーカイブ
- PII情報のマスキング

## 6. インフラストラクチャセキュリティ

### 6.1 CDN/WAF設定（Cloudflare推奨）

```javascript
// Cloudflare設定例
{
  securityLevel: 'high',
  sslMode: 'full_strict',
  minTlsVersion: '1.2',
  automaticHttpsRewrites: 'on',
  alwaysUseHttps: 'on',
  
  // WAFルール
  wafRules: {
    owaspCoreRuleSet: 'enabled',
    rateLimiting: {
      threshold: 50,
      period: '1min',
      action: 'challenge',
    },
  },
  
  // DDoS保護
  ddosProtection: 'enabled',
  
  // ボット管理
  botManagement: {
    challengeSuspiciousBots: true,
    blockDefinitelyAutomatedBots: true,
  },
}
```

### 6.2 DNS セキュリティ

- DNSSEC有効化
- CAA レコードの設定
- SPF/DKIM/DMARC設定（メール送信用）

## 7. 依存関係の管理

### 7.1 定期的な脆弱性スキャン

```bash
# 週次で実行
npm audit --production
npm outdated

# 自動化ツール
- Dependabot（GitHub）
- Snyk
- WhiteSource
```

### 7.2 依存関係の固定

```json
// package.json
{
  "dependencies": {
    "next": "15.0.3",  // 正確なバージョン指定
    "react": "18.3.1",
    // ...
  },
  "overrides": {
    // 脆弱性のある依存関係の強制アップデート
  }
}
```

## 8. インシデント対応

### 8.1 セキュリティインシデント対応計画

1. **検知**
   - 異常なトラフィックパターン
   - 多数の認証失敗
   - 不正なデータアクセス

2. **対応**
   - 影響範囲の特定
   - 証拠の保全
   - 一時的な対策の実施

3. **復旧**
   - 根本原因の解決
   - システムの復旧
   - 監視の強化

4. **事後対応**
   - インシデントレポート作成
   - 再発防止策の実施
   - ステークホルダーへの報告

### 8.2 緊急時の連絡先

```yaml
security_contacts:
  - role: セキュリティ責任者
    email: security@company.com
    phone: +81-XX-XXXX-XXXX
  
  - role: インフラ担当
    email: infra@company.com
    phone: +81-XX-XXXX-XXXX
  
  - role: 開発リード
    email: dev-lead@company.com
    phone: +81-XX-XXXX-XXXX
```

## 9. コンプライアンスとプライバシー

### 9.1 データ保護

- 個人情報の最小化
- データ保持期間の設定
- ユーザーデータの削除機能
- データポータビリティ

### 9.2 プライバシーポリシー

- データ収集の明示
- 第三者との共有について
- ユーザーの権利
- 連絡先情報

## 10. セキュリティチェックリスト

### デプロイ前
- [ ] すべての環境変数が本番用に設定されている
- [ ] デバッグモードが無効
- [ ] エラーメッセージが本番用
- [ ] 不要なAPIエンドポイントが無効
- [ ] セキュリティヘッダーが設定されている

### デプロイ後
- [ ] SSL証明書が有効
- [ ] セキュリティヘッダーが適用されている
- [ ] レート制限が機能している
- [ ] ログが正しく記録されている
- [ ] 監視アラートが設定されている

### 定期的な確認（月次）
- [ ] 依存関係の脆弱性スキャン
- [ ] ログの確認と分析
- [ ] アクセスパターンの異常確認
- [ ] バックアップの確認
- [ ] セキュリティポリシーの見直し