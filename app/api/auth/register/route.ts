import { NextRequest } from 'next/server';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import dbConnect from '@/lib/db';
import User from '@/models/User.model';
import { emailService } from '@/lib/email/service';
import { TokenUtils } from '@/utils/tokenUtils';
import { registerSchema } from '@/schemas/auth';
import { checkPasswordStrength } from '@/utils/passwordStrength';
import { normalizeUser } from '@/utils/dataTransform';
import { successResponse, errorResponse, standardErrors, checkRequiredEnvVars, missingEnvVarsResponse } from '@/utils/apiResponse';

// Edge Runtimeではnodemailer/bcryptjsが動作しないため、Node.js Runtimeを使用
export const runtime = 'nodejs';

// レート制限用のMap（本番環境ではRedisを使用）
const rateLimitMap = new Map<string, { count: number; resetAt: Date }>();

function checkRateLimit(identifier: string): boolean {
  const now = new Date();
  const limit = 5; // 1時間に5回まで
  const windowMs = 60 * 60 * 1000; // 1時間
  
  const record = rateLimitMap.get(identifier);
  
  if (!record || record.resetAt < now) {
    rateLimitMap.set(identifier, {
      count: 1,
      resetAt: new Date(now.getTime() + windowMs),
    });
    return true;
  }
  
  if (record.count >= limit) {
    return false;
  }
  
  record.count++;
  return true;
}

export async function POST(request: NextRequest) {
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  // 必須環境変数チェック
  const envCheck = checkRequiredEnvVars(['MONGODB_URI', 'JWT_SECRET']);
  if (!envCheck.allPresent) {
    return missingEnvVarsResponse(envCheck.missing);
  }
  
  if (isDevelopment) {
    console.log('=== 登録API開始 ===');
    console.log('環境変数チェック:', {
      NODE_ENV: process.env.NODE_ENV,
      MONGODB_URI: !!process.env.MONGODB_URI,
      JWT_SECRET: !!process.env.JWT_SECRET,
      EMAIL_PROVIDER: process.env.EMAIL_PROVIDER
    });
  }
  
  try {
    // Content-Typeチェック
    const contentType = request.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      return standardErrors.badRequest('Content-Type must be application/json');
    }
    // リクエストボディの取得（JSON解析エラーをキャッチ）
    let body;
    try {
      body = await request.json();
    } catch (parseError) {
      console.error('リクエストボディのJSON解析エラー:', parseError);
      return errorResponse('不正なリクエスト形式です', 'INVALID_JSON', 400);
    }
    
    // 受信したボディの詳細をログ出力
    console.log('受信したボディのキー:', Object.keys(body));
    console.log('受信した完全なボディ:', JSON.stringify(body, null, 2));
    
    // passwordLengthフィールドの存在を最初にチェック
    const hasPasswordLength = 'passwordLength' in body;
    const hasConfirmPasswordLength = 'confirmPasswordLength' in body;
    
    console.log('登録リクエスト受信:', { 
      name: body.name, 
      email: body.email, 
      passwordLength: body.password?.length,
      confirmPasswordLength: body.confirmPassword?.length,
      hasPassword: !!body.password,
      hasConfirmPassword: !!body.confirmPassword,
      passwordType: typeof body.password,
      confirmPasswordType: typeof body.confirmPassword,
      hasPasswordLength,
      hasConfirmPasswordLength
    });
    
    // レート制限チェック（IPアドレスまたはメールアドレスで制限）
    const clientIp = request.headers.get('x-forwarded-for') || 'unknown';
    const rateLimitKey = body.email || clientIp;
    
    if (!checkRateLimit(rateLimitKey)) {
      return standardErrors.rateLimitExceeded();
    }
    
    // passwordLengthが送信されている場合の特別なチェック（最優先）
    if ('passwordLength' in body || 'confirmPasswordLength' in body) {
      console.error('警告: passwordLengthフィールドが検出されました。ブラウザ拡張機能やセキュリティソフトが干渉している可能性があります。');
      console.error('受信したデータ:', body);
      return errorResponse(
        'セキュリティソフトやブラウザ拡張機能がパスワードの送信を妨げています。拡張機能を無効にするか、別のブラウザでお試しください。', 
        'PASSWORD_BLOCKED',
        400,
        {
          receivedFields: Object.keys(body),
          expectedFields: ['name', 'email', 'password', 'confirmPassword'],
          suggestion: 'ブラウザの拡張機能（特にパスワードマネージャーやセキュリティ拡張機能）を一時的に無効にしてください。',
          receivedData: body
        }
      );
    }
    
    // パスワードフィールドの存在チェック
    if (!body.password || typeof body.password !== 'string') {
      console.error('パスワードフィールドが不正:', {
        hasPassword: !!body.password,
        passwordType: typeof body.password,
        receivedKeys: Object.keys(body),
        receivedData: body
      });
      
      return errorResponse(
        'パスワードが送信されていません。ブラウザを更新して再度お試しください。', 
        'MISSING_PASSWORD',
        400,
        {
          receivedFields: Object.keys(body),
          expectedFields: ['name', 'email', 'password', 'confirmPassword']
        }
      );
    }
    
    // バリデーション
    let validatedData;
    try {
      validatedData = registerSchema.parse(body);
      console.log('バリデーション成功');
    } catch (validationError) {
      if (validationError instanceof z.ZodError) {
        console.error('バリデーションエラー:', validationError.issues);
        return standardErrors.validationError(
          'バリデーションエラー',
          validationError.issues.map((issue) => ({
            field: issue.path.join('.'),
            message: issue.message
          }))
        );
      }
      throw validationError;
    }

    // MongoDB接続
    console.log('MongoDB接続開始...');
    try {
      await dbConnect();
      console.log('MongoDB接続成功');
    } catch (dbError) {
      console.error('MongoDB接続エラー:', dbError);
      return standardErrors.databaseError('データベース接続エラーが発生しました');
    }

    // 既存ユーザーチェック
    const existingUser = await User.findOne({ email: validatedData.email });
    
    if (existingUser) {
      console.log('既存ユーザーが見つかりました:', validatedData.email);
      return standardErrors.conflict('このメールアドレスは既に登録されています');
    }

    // パスワード強度チェック
    if (!isDevelopment) {
      // 本番環境でのみパスワード強度をチェック
      const passwordStrength = checkPasswordStrength(validatedData.password);
      if (!passwordStrength.isStrong) {
        return errorResponse(
          'パスワードが弱すぎます',
          'WEAK_PASSWORD',
          400,
          {
            feedback: passwordStrength.feedback,
            suggestions: passwordStrength.suggestions,
          }
        );
      }
    }

    // パスワードをハッシュ化
    const hashedPassword = await bcrypt.hash(validatedData.password, 12);

    // ユーザーを作成
    const user = await User.create({
      email: validatedData.email,
      password: hashedPassword,
      name: validatedData.name,
      emailVerified: isDevelopment ? true : false,
    });

    console.log('ユーザー作成成功:', user.email);

    // メール確認トークンを生成
    const confirmationToken = TokenUtils.generateEmailConfirmationToken(
      (user as any)._id.toString(),
      user.email
    );

    // JWTトークンに有効期限があるため、データベースへの保存は不要

    // 確認メールを送信
    let emailSent = false;
    try {
      // APP_URLが未設定の場合のフォールバック
      const appUrl = process.env.APP_URL || 
        (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');
      const verificationUrl = `${appUrl}/api/auth/verify?token=${confirmationToken}`;
      
      // メール送信を試行
      console.log('メール送信を試行中...');
      const emailResult = await emailService.sendVerificationEmail(user.email, {
        name: user.name,
        verificationUrl,
      });
      emailSent = emailResult.success;
      
      if (emailSent) {
        console.log('メール送信成功');
      } else {
        console.error('メール送信失敗:', emailResult.error);
        // 開発環境では確認URLをコンソールに出力
        if (isDevelopment) {
          console.log('開発環境: 確認URL:', verificationUrl);
        }
      }
    } catch (emailError) {
      console.error('確認メール送信エラー:', emailError);
      emailSent = false;
    }

    // ユーザーデータを正規化（_idをidに変換）
    const normalizedUser = normalizeUser(user);
    if (!normalizedUser) {
      throw new Error('ユーザーデータの正規化に失敗しました');
    }

    // メール送信に失敗した場合は202、成功した場合は201を返す
    const message = emailSent
      ? '登録が完了しました。確認メールをご確認ください。'
      : isDevelopment 
        ? '登録が完了しました。開発環境のため、メール確認は自動的に完了しています。'
        : '登録が完了しました。確認メールの送信に失敗しましたが、後ほど再送信できます。';

    // 固定化されたレスポンス仕様
    const userData = {
      id: normalizedUser.id,
      email: normalizedUser.email,
    };
    
    if (emailSent) {
      // メール送信成功: 201 Created
      return successResponse(
        { user: userData },
        message,
        201,
        { emailSent: true }
      );
    } else {
      // メール送信失敗: 202 Accepted
      return successResponse(
        { user: userData },
        message,
        202,
        { 
          requiresEmailVerification: true,
          emailSent: false 
        }
      );
    }
  } catch (error) {
    console.error('=== 登録エラーの詳細 ===');
    console.error('エラーオブジェクト:', error);
    console.error('エラータイプ:', typeof error);
    console.error('エラー名:', error instanceof Error ? error.name : 'Unknown');
    console.error('エラーメッセージ:', error instanceof Error ? error.message : String(error));
    
    // スタックトレースを取得
    if (error instanceof Error && error.stack) {
      console.error('スタックトレース:', error.stack);
    }
    
    // MongoDBエラーの処理
    if (error && typeof error === 'object' && 'code' in error) {
      const mongoError = error as any;
      
      // E11000: 重複キーエラー
      if (mongoError.code === 11000) {
        console.log('重複キーエラー:', mongoError);
        return standardErrors.conflict('このメールアドレスは既に登録されています');
      }
    }
    
    // 詳細なエラー情報をログに出力
    let errorMessage = 'ユーザー登録に失敗しました';
    let statusCode = 500;
    const errorDetails: any = {
      error: error instanceof Error ? error.message : String(error),
      name: error instanceof Error ? error.name : 'Unknown',
      stack: error instanceof Error ? error.stack : undefined,
    };
    
    if (error instanceof Error) {
      errorMessage = error.message;
      
      // MongoDB接続エラーの場合
      if (error.message.includes('MONGODB_URI') || error.message.includes('connect')) {
        errorMessage = 'データベース接続エラー';
        errorDetails.type = 'DATABASE_CONNECTION_ERROR';
        statusCode = 503;
      }
      // メール設定エラーの場合
      else if (error.message.includes('credentials not configured')) {
        errorMessage = 'メール設定エラー';
        errorDetails.type = 'EMAIL_CONFIGURATION_ERROR';
        statusCode = 502;
      }
      // その他の既知のエラー
      else if (error.message.includes('ユーザーデータの正規化に失敗')) {
        errorMessage = 'データ処理エラー';
        errorDetails.type = 'DATA_PROCESSING_ERROR';
      }
    }
    
    console.error('=== エラーレスポンス準備 ===');
    console.error('エラータイプ:', errorDetails.type || 'UNKNOWN');
    console.error('エラーメッセージ:', errorMessage);
    console.error('ステータスコード:', statusCode);
    
    // 開発環境では詳細なエラーを返す
    if (process.env.NODE_ENV === 'development') {
      return errorResponse(
        errorMessage,
        errorDetails.type || 'UNKNOWN_ERROR',
        statusCode,
        errorDetails
      );
    }
    
    // 本番環境では一般的なエラーメッセージを返す
    return errorResponse('ユーザー登録に失敗しました', 'REGISTRATION_FAILED', statusCode);
  }
}