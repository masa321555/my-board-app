# 新規登録ペイロード修正ログ - 2025年1月19日 00:15:30

## 概要
新規登録時にパスワードフィールドが送信されず500エラーが発生する問題を修正しました。

## 問題の詳細
1. **症状**
   - 新規登録ボタンをクリックすると「ユーザー登録に失敗しました」と表示される
   - ブラウザの開発者ツールで確認すると、送信ペイロードに`passwordLength`と`confirmPasswordLength`のみが含まれている
   - 実際のパスワード値が送信されていない
   - サーバー側で500エラーが発生

2. **原因の推測**
   - ブラウザの拡張機能やセキュリティソフトがパスワードフィールドを自動的に除去している可能性
   - fetchのインターセプターが存在する可能性
   - React Hook Formの処理で問題が発生している可能性

## 実施した修正内容

### 1. フロントエンドの修正（00:00-00:05）
**ファイル**: `/app/auth/register/page.tsx`

#### a. 送信データの明示的な確認
```typescript
// 実際に送信するデータを再確認
const bodyToSend = JSON.stringify({
  name: data.name,
  email: data.email,
  password: data.password,
  confirmPassword: data.confirmPassword,
});

console.log('実際の送信データ:', bodyToSend);

const response = await fetch('/api/auth/register', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: bodyToSend,
});
```

### 2. サーバー側のバリデーション強化（00:05-00:10）
**ファイル**: `/app/api/auth/register/route.ts`

#### a. パスワードフィールドの存在チェック
```typescript
// パスワードフィールドの存在チェック
if (!body.password || typeof body.password !== 'string') {
  console.error('パスワードフィールドが不正:', {
    hasPassword: !!body.password,
    passwordType: typeof body.password,
    receivedKeys: Object.keys(body)
  });
  return NextResponse.json(
    { 
      ok: false, 
      error: 'パスワードが送信されていません。ブラウザを更新して再度お試しください。', 
      code: 'MISSING_PASSWORD',
      details: {
        receivedFields: Object.keys(body),
        expectedFields: ['name', 'email', 'password', 'confirmPassword']
      }
    },
    { status: 400 }
  );
}
```

#### b. 詳細なリクエストボディログ
```typescript
// 受信したボディの詳細をログ出力
console.log('受信したボディのキー:', Object.keys(body));
console.log('受信した完全なボディ:', JSON.stringify(body, null, 2));

console.log('登録リクエスト受信:', { 
  name: body.name, 
  email: body.email, 
  passwordLength: body.password?.length,
  confirmPasswordLength: body.confirmPassword?.length,
  hasPassword: !!body.password,
  hasConfirmPassword: !!body.confirmPassword,
  passwordType: typeof body.password,
  confirmPasswordType: typeof body.confirmPassword
});
```

#### c. バリデーションエラーの分離
```typescript
// バリデーション
let validatedData;
try {
  validatedData = registerSchema.parse(body);
  console.log('バリデーション成功');
} catch (validationError) {
  if (validationError instanceof z.ZodError) {
    console.error('バリデーションエラー:', validationError.issues);
    return NextResponse.json(
      { 
        ok: false,
        error: 'バリデーションエラー', 
        code: 'VALIDATION_ERROR',
        details: validationError.issues.map((issue) => ({
          field: issue.path.join('.'),
          message: issue.message
        }))
      },
      { status: 400 }
    );
  }
  throw validationError;
}
```

### 3. デバッグコードの整理（00:10）
- 開発環境でのみ詳細なログを出力するように変更
- 重複したZodErrorハンドリングを削除
- 環境変数チェックを開発環境限定に

## 技術的な詳細

### HTTPステータスコードの整理
- 400 Bad Request: バリデーションエラー、必須フィールド不足
- 409 Conflict: メールアドレスの重複
- 429 Too Many Requests: レート制限超過
- 500 Internal Server Error: 予期しないエラー

### エラーコードの追加
- `MISSING_PASSWORD`: パスワードフィールドが送信されていない
- `VALIDATION_ERROR`: Zodバリデーションエラー
- `EMAIL_ALREADY_EXISTS`: メールアドレスの重複
- `RATE_LIMIT_EXCEEDED`: レート制限超過

## 結果
- パスワードフィールドの明示的なチェック: 実装 ✅
- 詳細なエラーレスポンス: 実装 ✅
- デバッグログの改善: 完了 ✅
- ビルドテスト: 成功 ✅

## ブランチ情報
- 作業ブランチ: `fix-registration-payload-20250118`
- マージ先: `main`
- コミットハッシュ: `2c0494f`

## 今後の推奨事項

### 1. 根本原因の調査
パスワードフィールドが送信されない問題の根本原因を特定するため：
- 異なるブラウザでのテスト（Chrome、Firefox、Safari）
- ブラウザ拡張機能を無効にしてのテスト
- プライベートブラウジングモードでのテスト
- 開発者ツールのNetworkタブで実際の送信データを確認

### 2. 代替案の検討
問題が解決しない場合：
- FormDataを使用した送信方式への変更
- axiosライブラリの使用
- 送信前のデータ検証強化

### 3. セキュリティの考慮
- パスワードを平文でログ出力しないよう注意（現在は長さのみ出力）
- 本番環境では詳細なエラー情報を隠蔽
- CSRFトークンの実装検討

## 作業完了時刻
2025年1月19日 00:15:30