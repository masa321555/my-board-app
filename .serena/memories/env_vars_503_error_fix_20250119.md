# 環境変数503エラー修正 - 2025-01-19

## 問題の概要

### ユーザーからの報告
- エラー内容: 「必要な環境変数が設定されていません」
- HTTPステータス: 503 Service Unavailable  
- エラーコード: CONFIGURATION_ERROR
- セキュリティ問題: ブラウザコンソールにパスワードの実値が表示されていた

### 根本原因
Vercel本番環境で必要な環境変数が設定されていなかった

## 実施した修正

### 1. 環境変数チェックの詳細化

#### /src/utils/apiResponse.ts
```typescript
export function missingEnvVarsResponse(missingVars: string[]): NextResponse<ApiErrorResponse> {
  console.error('必要な環境変数が不足しています:', missingVars);
  return errorResponse(
    '必要な環境変数が設定されていません',
    'CONFIGURATION_ERROR',
    503,
    { 
      missing: missingVars,
      message: 'サーバーの設定が不完全です。管理者にお問い合わせください。'
    }
  );
}
```

#### /app/api/auth/register/route.ts
- DB設定（必須）とメール設定（任意）を分離
- JWT_SECRETまたはNEXTAUTH_SECRETのどちらか一方で動作するように変更

```typescript
// DB関連の環境変数チェック（必須）
const dbEnvCheck = checkRequiredEnvVars(requiredDbVars);
if (!dbEnvCheck.allPresent) {
  console.error('DB関連の必須環境変数が不足:', dbEnvCheck.missing);
  return missingEnvVarsResponse(dbEnvCheck.missing);
}

// 認証関連の環境変数チェック（JWT_SECRETまたはNEXTAUTH_SECRETのいずれかが必須）
const hasJwtSecret = !!process.env.JWT_SECRET || !!process.env.NEXTAUTH_SECRET;
if (!hasJwtSecret) {
  console.error('認証関連の必須環境変数が不足: JWT_SECRETまたはNEXTAUTH_SECRETが必要です');
  return missingEnvVarsResponse(['JWT_SECRET or NEXTAUTH_SECRET']);
}
```

### 2. JWT認証の互換性対応

#### /src/utils/tokenUtils.ts
```typescript
private static getJwtSecret(): string {
  const secret = process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET or NEXTAUTH_SECRET must be defined');
  }
  return secret;
}
```

### 3. セキュリティ修正

#### /app/auth/register/page.tsx
パスワードの実値をコンソールに出力しないように修正：

```typescript
console.log('data.password length:', data.password?.length || 0);
console.log('送信データ（オブジェクト）:', {
  ...dataToSend,
  password: '[REDACTED]',
  confirmPassword: '[REDACTED]'
});
```

### 4. ユーザー向けエラーメッセージの改善

#### /app/auth/register/page.tsx
```typescript
} else if (result.code === 'CONFIGURATION_ERROR') {
  // 環境変数エラーの特別な処理
  safeSetState(() => {
    setServerError(
      '現在、システムメンテナンス中のため新規登録を一時停止しています。\n' +
      '恐れ入りますが、しばらく時間をおいてから再度お試しください。'
    );
  });
}
```

### 5. ヘルスチェックエンドポイントの作成

#### /app/api/health/config/route.ts
環境変数の設定状況を確認できるエンドポイントを新規作成。
開発環境では詳細情報、本番環境では最小限の情報を返す。

## Vercelで必要な環境変数

### 必須
- `MONGODB_URI`: MongoDB接続文字列
- `NEXTAUTH_SECRET`: NextAuth.jsのシークレット（またはJWT_SECRET）

### 任意（メール送信用）
- `EMAIL_FROM`: 送信元メールアドレス
- SMTP設定: `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`
- SendGrid設定: `SENDGRID_API_KEY`

### 重要な注意事項
1. 環境変数設定後は再デプロイが必要
2. ターゲット（Production/Preview/Development）を正しく設定
3. MongoDB Atlasの場合、VercelのIPアドレスを許可する必要がある

## 関連ファイル
- /src/utils/apiResponse.ts
- /app/api/auth/register/route.ts
- /src/utils/tokenUtils.ts
- /app/auth/register/page.tsx
- /app/api/health/config/route.ts

## ログファイル
- /log/env-vars-503-fix-2025-08-19-0241.md