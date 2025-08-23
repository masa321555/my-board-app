# SNS機能開発に必要なパッケージ

## 必要なパッケージ一覧

### 1. リアルタイム通信（通知用）
```bash
# Socket.ioを使用する場合
npm install socket.io socket.io-client

# または、Server-Sent Events（SSE）を使用する場合（追加パッケージ不要）
```

### 2. パフォーマンス最適化
```bash
# キャッシュ管理（既にlru-cacheがインストール済み）
# 追加は不要

# 画像最適化（既にsharpがインストール済み）
# 追加は不要
```

### 3. 日付・時刻処理
```bash
# 既にdate-fnsがインストール済み
# 追加は不要
```

### 4. セキュリティ
```bash
# 既に必要なパッケージがインストール済み
# - bcryptjs（パスワード）
# - helmet（セキュリティヘッダー）
# - express-rate-limit（レート制限）
# - dompurify（XSS対策）
```

### 5. データベース
```bash
# 既にMongoDBとMongooseがインストール済み
# 追加は不要
```

### 6. テスト関連（開発依存）
```bash
# パフォーマンステスト用
npm install --save-dev @artillery/core

# モックデータ生成用
npm install --save-dev @faker-js/faker
```

## インストールコマンド

### 本番環境用
```bash
npm install socket.io socket.io-client
```

### 開発環境用
```bash
npm install --save-dev @artillery/core @faker-js/faker
```

## 既存パッケージで十分なもの
- MongoDB/Mongoose: データベース操作
- Material UI: UIコンポーネント
- React Hook Form + Zod: フォームバリデーション
- Next.js API Routes: APIエンドポイント
- NextAuth: 認証
- date-fns: 日付処理
- winston: ロギング
- sharp: 画像処理
- lru-cache: キャッシュ管理