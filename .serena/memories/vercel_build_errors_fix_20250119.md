# Vercelビルドエラー修正 - 2025-01-19

## 修正したビルドエラー

### 1. ESLintエラー

#### react/no-unescaped-entities
**ファイル**: /app/auth/register-simple/page.tsx
**修正**: 引用符をHTMLエンティティにエスケープ
```tsx
// Before
<code>password: "実際の値"</code>

// After  
<code>password: &quot;実際の値&quot;</code>
```

#### 未使用変数
**ファイル**: /app/api/auth/register/route.ts
**修正**: 使用されていない`statusCode`変数を削除（254行目）

#### 未使用import
**ファイル**: /app/auth/register/page-backup.tsx
**修正**: `useCallback, useRef, useEffect`の未使用importを削除

### 2. ファイル構成の修正

#### バックアップファイルの移動
- `/app/auth/register/page-backup.tsx` → `/src/app.backup/auth/register/page-backup.tsx`
- appディレクトリ外に移動してVercelビルドから除外

#### ESLint設定の更新
**ファイル**: eslint.config.mjs
```javascript
ignores: [
  "src/app.backup",
  "**/*.backup",
  "**/backup/**",
  ".next",
  "node_modules",
  "log/**"
]
```

## 関連する修正

### パスワードブロック問題への対応
ブラウザ拡張機能がパスワードフィールドを変換する問題に対して：
- Base64エンコーディング版: `/api/auth/register-encoded`
- FormData版: `/api/auth/register-formdata`
- テストページ: `/auth/register-test`
- ユーザー向け説明ページ: `/auth/register-simple`

## デプロイ手順
1. 新しいブランチ作成: `fix-vercel-build-errors-20250119`
2. ESLintエラーを修正
3. バックアップファイルを移動
4. ビルドテスト実行（成功）
5. mainブランチへマージ
6. GitHubへプッシュ
7. Vercelが自動デプロイ

## ログファイル
- /log/vercel-build-fix-2025-08-18.md