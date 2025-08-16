# MongoDB Atlas 本番環境設定ガイド

## 1. クラスター作成

### 1.1 基本設定
1. MongoDB Atlasにログイン
2. "Build a Cluster"をクリック
3. 以下の設定を選択：

```yaml
クラウドプロバイダー: AWS
リージョン: Asia Pacific (Tokyo) - ap-northeast-1
クラスタータイプ: M10 Dedicated (本番推奨)
```

### 1.2 クラスター構成
```yaml
レプリカセット: 3ノード
バックアップ: 有効
暗号化: Encryption at Rest 有効
モニタリング: 有効
```

## 2. セキュリティ設定

### 2.1 ネットワークアクセス

#### オプション1: Vercel IPアドレスをホワイトリスト化
```
# Vercelの静的IPアドレス（定期的に確認が必要）
# https://vercel.com/docs/concepts/security/secure-compute

注意: VercelはデフォルトでダイナミックIPを使用するため、
エンタープライズプランでない場合は、オプション2を推奨
```

#### オプション2: すべてのIPを許可（認証で保護）
```
IPアドレス: 0.0.0.0/0
コメント: Allow access from anywhere (secured by authentication)
```

### 2.2 データベースユーザー作成

1. Database Accessタブへ移動
2. "Add New Database User"をクリック
3. 以下の設定：

```yaml
認証方法: Password
ユーザー名: prod-app-user
パスワード: [強力なパスワードを生成]

権限設定:
  - Built-in Role: readWrite
  - Database: production-db（特定のDBのみ）
  
追加の制限:
  - ネットワーク制限: 有効（可能な場合）
  - 一時ユーザー: 無効
```

### 2.3 接続文字列の取得

1. Clustersタブで"Connect"をクリック
2. "Connect your application"を選択
3. Driver: Node.js, Version: 5.0 or later
4. 接続文字列をコピー：

```
mongodb+srv://prod-app-user:<password>@cluster-name.xxxxx.mongodb.net/?retryWrites=true&w=majority&appName=BoardApp
```

## 3. データベース初期設定

### 3.1 データベースとコレクション作成

MongoDB Shellまたは Compassで実行：

```javascript
// データベース作成
use production-db

// コレクション作成
db.createCollection("users")
db.createCollection("posts")
db.createCollection("sessions")
db.createCollection("auditlogs")
```

### 3.2 インデックス作成

パフォーマンスとセキュリティのため、以下のインデックスを作成：

```javascript
// Users collection
db.users.createIndex({ email: 1 }, { unique: true })
db.users.createIndex({ createdAt: -1 })

// Posts collection
db.posts.createIndex({ createdAt: -1 })
db.posts.createIndex({ author: 1, createdAt: -1 })
db.posts.createIndex({ updatedAt: -1 })

// Sessions collection
db.sessions.createIndex({ sessionToken: 1 }, { unique: true })
db.sessions.createIndex({ userId: 1 })
db.sessions.createIndex({ expires: 1 }, { expireAfterSeconds: 0 })

// Audit logs collection (90日でTTL)
db.auditlogs.createIndex({ timestamp: 1 }, { expireAfterSeconds: 7776000 })
db.auditlogs.createIndex({ userId: 1, timestamp: -1 })
db.auditlogs.createIndex({ action: 1, timestamp: -1 })
```

### 3.3 バリデーションルール

コレクションレベルのバリデーション設定：

```javascript
// Users collection validation
db.runCommand({
  collMod: "users",
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["email", "password", "name"],
      properties: {
        email: {
          bsonType: "string",
          pattern: "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$"
        },
        name: {
          bsonType: "string",
          minLength: 1,
          maxLength: 50
        }
      }
    }
  }
})

// Posts collection validation
db.runCommand({
  collMod: "posts",
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["title", "content", "author"],
      properties: {
        title: {
          bsonType: "string",
          minLength: 1,
          maxLength: 100
        },
        content: {
          bsonType: "string",
          minLength: 1,
          maxLength: 1000
        }
      }
    }
  }
})
```

## 4. バックアップ設定

### 4.1 自動バックアップ

1. Backup タブへ移動
2. 以下の設定を適用：

```yaml
バックアップ頻度: Daily
保持期間: 7 days
時刻: 02:00 JST（トラフィックの少ない時間）
```

### 4.2 ポイントインタイムリカバリ

```yaml
Continuous Backup: 有効
保持期間: 24時間
```

### 4.3 バックアップのテスト

定期的に以下を実施：
1. テスト環境へのリストア
2. データ整合性の確認
3. リストア時間の測定

## 5. モニタリング設定

### 5.1 アラート設定

MongoDB Atlasダッシュボードで設定：

```yaml
アラート項目:
  - クラスターCPU使用率 > 80%
  - メモリ使用率 > 85%
  - ディスク使用率 > 80%
  - 接続数 > 400
  - レプリケーション遅延 > 60秒
  - プライマリノード障害

通知先:
  - Email: ops-team@company.com
  - Slack: #alerts-mongodb
  - PagerDuty: 緊急時用
```

### 5.2 パフォーマンスアドバイザー

1. Performance Advisorタブを確認
2. 推奨インデックスの確認と適用
3. スロークエリの分析

### 5.3 Real-Time Performance Panel

監視項目：
- Operations
- Read/Write分布
- ネットワークトラフィック
- キューの深さ

## 6. 接続最適化

### 6.1 Connection Pooling

アプリケーション側の設定：

```javascript
// MongoDB接続オプション
const options = {
  // Connection Pool設定
  minPoolSize: 10,
  maxPoolSize: 50,
  maxIdleTimeMS: 10000,
  
  // タイムアウト設定
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
  
  // 再試行設定
  retryWrites: true,
  retryReads: true,
  
  // 圧縮
  compressors: ['snappy', 'zlib'],
};
```

### 6.2 Read Preference

```javascript
// 読み取り設定
{
  readPreference: 'primaryPreferred',
  readConcern: { level: 'majority' },
  writeConcern: { 
    w: 'majority',
    j: true,
    wtimeout: 5000 
  }
}
```

## 7. コスト最適化

### 7.1 使用量の監視

- データ転送量の確認
- ストレージ使用量の最適化
- 不要なインデックスの削除

### 7.2 自動スケーリング

```yaml
Auto-scaling設定:
  最小: M10
  最大: M30
  
トリガー:
  - CPU > 75% for 5 minutes
  - Memory > 80% for 5 minutes
  
クールダウン: 10分
```

## 8. 災害復旧計画

### 8.1 マルチリージョン設定（オプション）

高可用性が必要な場合：

```yaml
プライマリ: Tokyo (ap-northeast-1)
セカンダリ: Singapore (ap-southeast-1)
優先度: Tokyo > Singapore
```

### 8.2 復旧手順

1. **障害検知**
   - アラート受信
   - 影響範囲の確認

2. **フェイルオーバー**
   - 自動フェイルオーバー（通常60秒以内）
   - 手動介入が必要な場合の手順

3. **データ復旧**
   - 最新のバックアップから復元
   - ポイントインタイムリカバリの使用

## 9. メンテナンス

### 9.1 定期メンテナンス

- **週次**: インデックス統計の更新
- **月次**: 未使用インデックスの確認
- **四半期**: スキーマの見直し

### 9.2 アップグレード計画

```yaml
MongoDB バージョン管理:
  - 現在: 7.0
  - アップグレードサイクル: 6ヶ月
  - テスト環境での検証: 必須
  - メンテナンスウィンドウ: 日曜日 02:00-04:00 JST
```

## 10. トラブルシューティング

### 10.1 よくある問題

1. **接続エラー**
   - ネットワークアクセスリストを確認
   - 認証情報を確認
   - DNS解決を確認

2. **パフォーマンス問題**
   - インデックスの確認
   - クエリの最適化
   - リソース使用状況の確認

3. **レプリケーション遅延**
   - ネットワーク遅延の確認
   - Write Concernの調整
   - セカンダリノードのリソース確認

### 10.2 サポート

- MongoDB Atlas Support（24/7）
- Community Forums
- Documentation: https://docs.atlas.mongodb.com/