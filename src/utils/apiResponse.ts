import { NextResponse } from 'next/server';

interface ApiSuccessResponse<T = any> {
  ok: true;
  data?: T;
  message?: string;
  [key: string]: any;
}

interface ApiErrorResponse {
  ok: false;
  error: string;
  code?: string;
  details?: any;
  requestId?: string;
}

export type ApiResponse<T = any> = ApiSuccessResponse<T> | ApiErrorResponse;

// リクエストID生成（簡易版）
function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// 成功レスポンス生成
export function successResponse<T = any>(
  data?: T,
  message?: string,
  statusCode: number = 200,
  additionalFields?: Record<string, any>
): NextResponse<ApiSuccessResponse<T>> {
  const response: ApiSuccessResponse<T> = {
    ok: true,
    ...(data !== undefined && { data }),
    ...(message && { message }),
    ...additionalFields,
  };

  return NextResponse.json(response, { status: statusCode });
}

// エラーレスポンス生成
export function errorResponse(
  error: string,
  code?: string,
  statusCode: number = 500,
  details?: any,
  includeRequestId: boolean = true
): NextResponse<ApiErrorResponse> {
  const response: ApiErrorResponse = {
    ok: false,
    error,
    ...(code && { code }),
    ...(details && { details }),
    ...(includeRequestId && { requestId: generateRequestId() }),
  };

  return NextResponse.json(response, { status: statusCode });
}

// 標準的なエラーレスポンス
export const standardErrors = {
  // 400番台エラー
  badRequest: (error: string = '不正なリクエストです', details?: any) =>
    errorResponse(error, 'BAD_REQUEST', 400, details),
  
  unauthorized: (error: string = '認証が必要です') =>
    errorResponse(error, 'UNAUTHORIZED', 401),
  
  forbidden: (error: string = 'アクセスが拒否されました') =>
    errorResponse(error, 'FORBIDDEN', 403),
  
  notFound: (error: string = 'リソースが見つかりません') =>
    errorResponse(error, 'NOT_FOUND', 404),
  
  conflict: (error: string = 'リソースの競合が発生しました') =>
    errorResponse(error, 'CONFLICT', 409),
  
  rateLimitExceeded: (error: string = 'リクエストが多すぎます。しばらく待ってから再度お試しください。') =>
    errorResponse(error, 'RATE_LIMIT_EXCEEDED', 429),
  
  validationError: (error: string = 'バリデーションエラー', details?: any) =>
    errorResponse(error, 'VALIDATION_ERROR', 400, details),
  
  // 500番台エラー
  internalServerError: (error: string = 'サーバーエラーが発生しました') =>
    errorResponse(error, 'INTERNAL_SERVER_ERROR', 500),
  
  databaseError: (error: string = 'データベースエラーが発生しました') =>
    errorResponse(error, 'DATABASE_ERROR', 503),
  
  serviceUnavailable: (error: string = 'サービスが一時的に利用できません') =>
    errorResponse(error, 'SERVICE_UNAVAILABLE', 503),
};

// 環境変数チェックヘルパー
export function checkRequiredEnvVars(
  requiredVars: string[]
): { missing: string[]; allPresent: boolean } {
  const missing = requiredVars.filter(varName => !process.env[varName]);
  return {
    missing,
    allPresent: missing.length === 0,
  };
}

// 環境変数不足エラーレスポンス
export function missingEnvVarsResponse(missingVars: string[]): NextResponse<ApiErrorResponse> {
  return errorResponse(
    '必要な環境変数が設定されていません',
    'CONFIGURATION_ERROR',
    503,
    { missingVars }
  );
}