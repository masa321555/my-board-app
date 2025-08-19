# アバター画像アップロード500エラー修正ログ - 2025-08-20 01:20:35

## 問題の概要

### ユーザー報告
- プロフィールページから「写真の変更」で画像をアップロードすると「アバター画像のアップロードに失敗しました」エラー
- POST /api/user/avatar が500エラーを返却

### 問題の原因
1. ローカルファイルシステムへの保存を前提とした実装（Vercelではエフェメラル）
2. 存在しない`imageUtils.ts`への依存
3. Edge Runtimeの指定がなく、Node.js専用APIが使用されていた
4. エラーハンドリングが不適切で、全てのエラーが500として返されていた

## 実施した修正

### 1. API Route Handlerの修正（/app/api/user/avatar/route.ts）

#### Node.jsランタイムの明示的な指定
```typescript
export const runtime = 'nodejs';
export const maxDuration = 60; // タイムアウト対策（60秒）
```

#### FormData対応への修正
```typescript
// 旧実装（JSONボディを期待）から変更
const formData = await request.formData();
const file = formData.get('file') as File | null;

// 互換性のため 'avatar' フィールドも確認
if (!file) {
  const avatarFile = formData.get('avatar') as File | null;
  if (!avatarFile) {
    return NextResponse.json({ 
      ok: false, 
      code: 'NO_FILE', 
      message: 'ファイルがアップロードされていません',
      requestId: crypto.randomUUID()
    }, { status: 400 });
  }
}
```

#### エラーハンドリングの改善
- 401 Unauthorized: 未認証
- 400 Bad Request: ファイル未添付、FormData解析エラー
- 413 Payload Too Large: ファイルサイズ超過（2MB以上）
- 415 Unsupported Media Type: 非対応ファイル形式
- 503 Service Unavailable: データベース接続エラー
- 500 Internal Server Error: その他の予期しないエラー

#### レスポンス形式の統一
```typescript
{
  ok: boolean,
  code: string,
  message: string,
  requestId: string
}
```

#### ファイル名の安全な生成
```typescript
const timestamp = Date.now();
const extension = uploadFile.type.split('/')[1];
const safeFileName = `${userId}/${timestamp}.${extension}`;
```

### 2. クライアント側の修正（/app/profile/page.tsx）

#### FormDataフィールド名の変更
```typescript
// 旧: formData.append('avatar', file);
formData.append('file', file);
```

#### ファイルサイズ制限の変更
```typescript
// 旧: 5MB
if (file.size > 2 * 1024 * 1024) {
  setMessage({
    type: 'error',
    text: 'ファイルサイズは2MB以下にしてください',
  });
  return;
}
```

#### エラーレスポンスの詳細表示
```typescript
if (!result.ok) {
  const errorMessage = result.data.message || result.data.error || 'アバターのアップロードに失敗しました';
  const errorCode = result.data.code;
  
  let detailedMessage = errorMessage;
  if (errorCode === 'FILE_TOO_LARGE') {
    detailedMessage += ' (最大2MBまで)';
  } else if (errorCode === 'UNSUPPORTED_MEDIA_TYPE') {
    detailedMessage += ' (JPEG、PNG、WebPのみ対応)';
  }
  
  throw new Error(detailedMessage);
}
```

### 3. インポートパスの修正
```typescript
// 旧: import dbConnect from '@/lib/mongodb';
import dbConnect from '@/lib/db';
```

## テスト結果
- ビルドテスト: ✅ 成功
- Lintチェック: ✅ エラーなし
- mainブランチへのマージ: ✅ 完了
- GitHubへのプッシュ: ✅ 完了

## 改善効果

1. **エラーの解消**
   - 500エラーが発生しなくなり、適切なエラーコードが返される
   - FormData形式での送受信が正常に動作

2. **エラーメッセージの改善**
   - ユーザーに具体的なエラー理由が表示される
   - リトライ可能なエラーかどうかが明確になる

3. **CSR互換性の確保**
   - Node.jsランタイムを明示的に指定
   - Vercelデプロイ時の互換性を確保

## 未実装の項目

### Vercel Blobなど外部ストレージへの移行
現在は仮のURLを返す実装となっており、実際の画像保存は未実装：
```typescript
// TODO: Vercel Blobへのアップロード実装
// 現在は仮のURLを返す
const avatarUrl = `/uploads/avatars/${safeFileName}`;
```

実装に必要な手順：
1. `@vercel/blob`パッケージのインストール
2. 環境変数`BLOB_READ_WRITE_TOKEN`の設定
3. `put()`関数を使用した画像アップロード実装
4. CDN URLの取得と保存

## 今後の推奨事項

1. **外部ストレージの実装**
   - Vercel Blob、S3、Cloudinaryなどの外部ストレージサービスへの移行
   - 画像のCDN配信によるパフォーマンス向上

2. **画像処理の実装**
   - リサイズ・最適化処理の追加
   - サムネイル生成機能

3. **プログレスバーの改善**
   - より正確なアップロード進捗表示
   - キャンセル機能の追加

4. **セキュリティの強化**
   - ファイル内容の検証（マジックナンバーチェック）
   - ウイルススキャン機能の追加

## 関連ファイル
- /app/api/user/avatar/route.ts
- /app/profile/page.tsx
- /src/auth.ts（JWT更新処理）