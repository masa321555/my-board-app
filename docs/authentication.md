# 会員認証機能

## 概要
会員制掲示板のための認証機能を実装しました。

## 実装内容

### 1. ユーザー認証
- ユーザー登録機能
- ログイン/ログアウト機能
- パスワードのハッシュ化（bcrypt）

### 2. JWT認証
- アクセストークンの発行
- トークンの検証
- 認証ミドルウェア

### 3. セキュリティ対策
- パスワードの暗号化
- HTTPS通信の強制
- XSS/CSRF対策

## API仕様

### ユーザー登録
```
POST /api/auth/register
{
  "email": "user@example.com",
  "password": "password123",
  "name": "ユーザー名"
}
```

### ログイン
```
POST /api/auth/login
{
  "email": "user@example.com",
  "password": "password123"
}
```

## テスト方法
1. `npm run dev`で開発サーバーを起動
2. `/register`ページでユーザー登録
3. `/login`ページでログイン
4. 認証が必要なページへアクセス