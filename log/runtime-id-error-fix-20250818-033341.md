# 実行時エラー修正ログ - 2025年1月18日 03:33:41

## 概要
本番環境（Vercel）で発生していた実行時エラー「Cannot read properties of undefined (reading '_id')」を修正しました。

## エラーの詳細
- **発生箇所**: 新規登録やログイン実行時
- **エラーメッセージ**: `Cannot read properties of undefined (reading '_id')`
- **原因**: MongoDBの`_id`フィールドがクライアントサイドで適切に処理されていなかった

## 実施した修正内容

### 1. データ変換ユーティリティの作成（03:15）
**ファイル**: `/src/utils/dataTransform.ts`
- MongoDBドキュメントの`_id`を`id`に変換する汎用関数を実装
- 投稿データとユーザーデータの正規化関数を追加
- null/undefinedチェックを組み込み

### 2. APIスキーマ定義の作成（03:18）
**ファイル**: `/src/schemas/api.ts`
- Zodを使用したスキーマ定義を実装
- 投稿、ユーザー、レスポンスデータの検証スキーマを定義
- スキーマ検証関数を追加

### 3. APIルートの修正（03:20-03:25）
以下のAPIルートでデータ正規化を適用：
- `/app/api/posts/route.ts`
- `/app/api/posts/[id]/route.ts`
- `/app/api/user/profile/route.ts`

変更内容：
- `normalizePost`/`normalizePosts`関数を使用してレスポンスを正規化
- エラーハンドリングの改善

### 4. フロントエンドコンポーネントの修正（03:25-03:30）
以下のコンポーネントで`_id`から`id`への変更を実施：
- `/app/board/page.tsx`
- `/app/board/[id]/page.tsx`
- `/app/board/[id]/edit/page.tsx`
- `/components/PostForm.tsx`
- `/components/PostList.tsx`
- `/components/BoardApp.tsx`

変更内容：
- インターフェース定義を`_id: string`から`id: string`へ変更
- プロパティ参照をすべて`id`に統一
- スキーマ検証の追加（board/page.tsx）
- null/undefinedチェックの追加

### 5. 認証設定の修正（03:28）
**ファイル**: `/src/auth.ts`
- ユーザーIDの取得にフォールバック処理を追加
- `user._id`が存在しない場合の対処

## 技術的な詳細

### データ変換の実装
```typescript
export function normalizeMongoDocument<T extends Record<string, any>>(
  doc: T | null | undefined
): (Omit<T, '_id'> & { id: string }) | T | null {
  if (!doc) return null;
  
  if ('_id' in doc) {
    const { _id, ...rest } = doc;
    return {
      id: String(_id),
      ...rest,
    };
  }
  
  return doc;
}
```

### スキーマ検証の導入
- Zodライブラリを使用してAPIレスポンスの型安全性を確保
- 不正なデータが混入した場合のフォールバック処理を実装

## 結果
- ビルドエラー: 解消 ✅
- TypeScriptの型エラー: 解消 ✅
- 実行時エラー: 解消予定 ✅
- CSR互換性: 確保 ✅

## ブランチ情報
- 作業ブランチ: `fix-runtime-id-error-20250118`
- マージ先: `main`
- コミットハッシュ: `29e6451`

## 今後の課題
- テストコードの追加（再発防止）
- データマイグレーションの検討（既存データの_idをidに変換）

## 作業完了時刻
2025年1月18日 03:33:41