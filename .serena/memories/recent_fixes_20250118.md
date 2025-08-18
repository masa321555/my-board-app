# 最近の重要な修正履歴 - 2025年1月18日

## 1. MongoDB _id から id への変換問題の修正（2025年1月18日）
### 問題
- 本番環境で「Cannot read properties of undefined (reading '_id')」エラーが発生
- MongoDBの`_id`フィールドをクライアント側で`id`として参照しようとしてエラー

### 解決策
- `/src/utils/dataTransform.ts`を作成し、MongoDB文書を正規化する関数を実装
- すべてのAPIレスポンスでデータ変換を適用
- 関連ファイル：
  - `/src/utils/dataTransform.ts` - 変換ユーティリティ
  - `/app/api/auth/register/route.ts`
  - `/app/api/user/profile/route.ts`
  - `/app/api/user/dashboard/route.ts`
  - `/app/api/posts/route.ts`
  - その他多数のAPIルート

## 2. 新規登録時の500エラー修正（2025年1月18日）
### 問題
- Edge RuntimeでnodemailerとbcryptjsがサポートされていないためAPIが500エラーを返す
- 「ユーザー登録に失敗しました」というエラーメッセージが表示される

### 解決策
- すべての認証関連APIに`export const runtime = 'nodejs'`を追加
- 適切なHTTPステータスコードの実装（400, 401, 409, 429, 502, 503）
- エラーハンドリングの詳細化

## 3. レスポンス形式の統一とレート制限（2025年1月18日）
### 問題
- 登録は成功するのに「登録に失敗しました」と表示される
- APIレスポンスの形式が統一されていない

### 解決策
- すべてのレスポンスを`{ok: true/false}`形式に統一
- IPアドレスベースのレート制限実装（1時間に5回まで）
- Content-Typeチェックの追加
- クライアント側で`result.ok`をチェックするように修正

## 4. メール送信機能の修正（2025年1月18日）
### 問題
- EMAIL_PROVIDER環境変数が設定されていないためメールが送信されない
- 開発環境でメール送信がスキップされる

### 解決策
- `.env.local`に`EMAIL_PROVIDER=smtp`を追加
- メールクライアントがMAIL_HOSTを検出した場合、自動的にSMTPプロバイダーとして認識
- Ethereal Email（テスト用SMTPサービス）のサポートを追加
- `getEmailClient()`を非同期関数に変更
- 開発環境でもメール送信を試行するように変更

### 修正ファイル
- `/src/lib/email/client.ts` - 環境変数の自動認識とEtherealサポート
- `/src/lib/email/service.ts` - 詳細なログ出力とプレビューURL表示
- `/app/api/auth/register/route.ts` - 開発環境での制限を削除

## 環境変数の重要性
### 本番環境（Vercel）で必要な設定
```
# MongoDB
MONGODB_URI=mongodb+srv://...

# NextAuth
NEXTAUTH_URL=https://your-domain.com
NEXTAUTH_SECRET=your-production-secret

# JWT
JWT_SECRET=your-jwt-secret

# メール設定
EMAIL_PROVIDER=smtp
MAIL_HOST=myboard321.site
MAIL_PORT=587
MAIL_USER=noreply@myboard321.site
MAIL_PASS=実際のパスワード
MAIL_FROM_ADDRESS=noreply@myboard321.site
```

## CSR（Client-Side Rendering）対応のポイント
1. Edge Runtimeの制限を理解し、必要に応じてNode.js Runtimeを使用
2. 環境変数のフォールバック処理を実装
3. エラー時の適切なレスポンスとステータスコード
4. データ変換の一貫性（MongoDB _id → id）

## 今後の注意点
- 新しいAPIルートを作成する際は必ず`normalizeMongoDocument`を使用
- nodemailerやbcryptjsを使用する場合は`export const runtime = 'nodejs'`を追加
- レスポンス形式は`{ok: true/false}`に統一
- 環境変数が未設定の場合のフォールバック処理を実装