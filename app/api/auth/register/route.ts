import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import dbConnect from '@/lib/db';
import User from '@/models/User.model';
import { emailService } from '@/lib/email/service';
import { TokenUtils } from '@/utils/tokenUtils';
import { registerSchema } from '@/schemas/auth';
import { checkPasswordStrength } from '@/utils/passwordStrength';
import { normalizeUser } from '@/utils/dataTransform';

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
      return NextResponse.json(
        { ok: false, error: 'Content-Type must be application/json' },
        { status: 400 }
      );
    }
    // リクエストボディの取得（JSON解析エラーをキャッチ）
    let body;
    try {
      body = await request.json();
    } catch (parseError) {
      console.error('リクエストボディのJSON解析エラー:', parseError);
      return NextResponse.json(
        { ok: false, error: '不正なリクエスト形式です', code: 'INVALID_JSON' },
        { status: 400 }
      );
    }
    
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
    
    // レート制限チェック（IPアドレスまたはメールアドレスで制限）
    const clientIp = request.headers.get('x-forwarded-for') || 'unknown';
    const rateLimitKey = body.email || clientIp;
    
    if (!checkRateLimit(rateLimitKey)) {
      return NextResponse.json(
        { ok: false, error: 'リクエストが多すぎます。しばらく待ってから再度お試しください。', code: 'RATE_LIMIT_EXCEEDED' },
        { status: 429 }
      );
    }
    
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

    // MongoDB接続
    console.log('MongoDB接続開始...');
    try {
      await dbConnect();
      console.log('MongoDB接続成功');
    } catch (dbError) {
      console.error('MongoDB接続エラー:', dbError);
      return NextResponse.json(
        { ok: false, error: 'データベース接続エラーが発生しました', code: 'DATABASE_CONNECTION_ERROR' },
        { status: 503 }
      );
    }

    // 既存ユーザーチェック
    const existingUser = await User.findOne({ email: validatedData.email });
    
    if (existingUser) {
      console.log('既存ユーザーが見つかりました:', validatedData.email);
      return NextResponse.json(
        { ok: false, error: 'このメールアドレスは既に登録されています', code: 'EMAIL_ALREADY_EXISTS' },
        { status: 409 }
      );
    }

    // パスワード強度チェック
    if (!isDevelopment) {
      // 本番環境でのみパスワード強度をチェック
      const passwordStrength = checkPasswordStrength(validatedData.password);
      if (!passwordStrength.isStrong) {
        return NextResponse.json(
          { 
            ok: false,
            error: 'パスワードが弱すぎます',
            code: 'WEAK_PASSWORD',
            details: {
              feedback: passwordStrength.feedback,
              suggestions: passwordStrength.suggestions,
            }
          },
          { status: 401 }
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
    const statusCode = emailSent ? 201 : 202;
    const message = emailSent
      ? '登録が完了しました。確認メールをご確認ください。'
      : isDevelopment 
        ? '登録が完了しました。開発環境のため、メール確認は自動的に完了しています。'
        : '登録が完了しました。確認メールの送信に失敗しましたが、後ほど再送信できます。';

    return NextResponse.json(
      {
        ok: true,
        message,
        user: {
          id: normalizedUser.id,
          email: normalizedUser.email,
        },
        emailSent,
      },
      { status: statusCode }
    );
  } catch (error) {
    console.error('登録エラーの詳細:', error);
    
    // MongoDBエラーの処理
    if (error && typeof error === 'object' && 'code' in error) {
      const mongoError = error as any;
      
      // E11000: 重複キーエラー
      if (mongoError.code === 11000) {
        console.log('重複キーエラー:', mongoError);
        return NextResponse.json(
          { ok: false, error: 'このメールアドレスは既に登録されています', code: 'EMAIL_ALREADY_EXISTS' },
          { status: 409 }
        );
      }
    }
    
    // 詳細なエラー情報をログに出力
    let errorMessage = 'ユーザー登録に失敗しました';
    let statusCode = 500;
    const errorDetails: any = {};
    
    if (error instanceof Error) {
      errorMessage = error.message;
      errorDetails.stack = error.stack;
      
      // MongoDB接続エラーの場合
      if (error.message.includes('MONGODB_URI') || error.message.includes('connect')) {
        errorMessage = 'データベース接続エラー';
        errorDetails.type = 'DATABASE_CONNECTION_ERROR';
        statusCode = 503;
      }
      // メール設定エラーの場合（これはもう発生しないはず）
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
    
    console.error('エラータイプ:', errorDetails.type || 'UNKNOWN');
    console.error('エラーメッセージ:', errorMessage);
    console.error('スタックトレース:', errorDetails.stack);
    
    // 開発環境では詳細なエラーを返す
    if (process.env.NODE_ENV === 'development') {
      return NextResponse.json(
        { 
          ok: false,
          error: errorMessage,
          code: errorDetails.type || 'UNKNOWN_ERROR',
          details: errorDetails
        },
        { status: statusCode }
      );
    }
    
    // 本番環境では一般的なエラーメッセージを返す
    return NextResponse.json(
      { ok: false, error: 'ユーザー登録に失敗しました', code: 'REGISTRATION_FAILED' },
      { status: statusCode }
    );
  }
}