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

export async function POST(request: NextRequest) {
  console.log('=== 登録API開始 ===');
  console.log('NODE_ENV:', process.env.NODE_ENV);
  console.log('MONGODB_URI 設定:', !!process.env.MONGODB_URI);
  console.log('JWT_SECRET 設定:', !!process.env.JWT_SECRET);
  console.log('APP_URL:', process.env.APP_URL);
  console.log('VERCEL_URL:', process.env.VERCEL_URL);
  console.log('EMAIL_PROVIDER:', process.env.EMAIL_PROVIDER);
  
  try {
    // リクエストボディの取得（JSON解析エラーをキャッチ）
    let body;
    try {
      body = await request.json();
    } catch (parseError) {
      console.error('リクエストボディのJSON解析エラー:', parseError);
      return NextResponse.json(
        { error: '不正なリクエスト形式です' },
        { status: 400 }
      );
    }
    
    console.log('登録リクエスト受信:', { 
      name: body.name, 
      email: body.email, 
      passwordLength: body.password?.length,
      confirmPasswordLength: body.confirmPassword?.length,
      hasConfirmPassword: !!body.confirmPassword
    });
    
    // バリデーション
    const validatedData = registerSchema.parse(body);
    console.log('バリデーション成功');

    // MongoDB接続
    console.log('MongoDB接続開始...');
    try {
      await dbConnect();
      console.log('MongoDB接続成功');
    } catch (dbError) {
      console.error('MongoDB接続エラー:', dbError);
      return NextResponse.json(
        { error: 'データベース接続エラーが発生しました' },
        { status: 503 }
      );
    }

    // 既存ユーザーチェック
    const existingUser = await User.findOne({ email: validatedData.email });
    
    if (existingUser) {
      console.log('既存ユーザーが見つかりました:', validatedData.email);
      return NextResponse.json(
        { error: 'このメールアドレスは既に登録されています' },
        { status: 409 }
      );
    }

    // 開発環境ではパスワード強度チェックをスキップ
    const isDevelopment = process.env.NODE_ENV === 'development';
    
    if (!isDevelopment) {
      // 本番環境でのみパスワード強度をチェック
      const passwordStrength = checkPasswordStrength(validatedData.password);
      if (!passwordStrength.isStrong) {
        return NextResponse.json(
          { 
            error: 'パスワードが弱すぎます',
            details: {
              feedback: passwordStrength.feedback,
              suggestions: passwordStrength.suggestions,
            }
          },
          { status: 400 }
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
      
      // 開発環境ではメール送信をスキップ
      if (isDevelopment) {
        console.log('開発環境: メール送信をスキップしました');
        console.log('確認URL:', verificationUrl);
        emailSent = false;
      } else {
        const emailResult = await emailService.sendVerificationEmail(user.email, {
          name: user.name,
          verificationUrl,
        });
        emailSent = emailResult.success;
        if (!emailSent) {
          console.error('メール送信失敗:', emailResult.error);
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
    const message = isDevelopment 
      ? '登録が完了しました。開発環境のため、メール確認は自動的に完了しています。'
      : emailSent
        ? '登録が完了しました。確認メールをご確認ください。'
        : '登録が完了しました。確認メールの送信に失敗しましたが、後ほど再送信できます。';

    return NextResponse.json(
      {
        message,
        user: {
          id: normalizedUser.id,
          email: normalizedUser.email,
          name: normalizedUser.name,
          emailVerified: normalizedUser.emailVerified,
        },
        emailSent,
      },
      { status: statusCode }
    );
  } catch (error) {
    console.error('登録エラーの詳細:', error);
    
    // Zodバリデーションエラー
    if (error instanceof z.ZodError) {
      console.log('バリデーションエラー詳細:', error.issues);
      return NextResponse.json(
        { 
          error: 'バリデーションエラー', 
          details: error.issues.map((issue) => ({
            field: issue.path.join('.'),
            message: issue.message
          }))
        },
        { status: 400 }
      );
    }
    
    // MongoDBエラーの処理
    if (error && typeof error === 'object' && 'code' in error) {
      const mongoError = error as any;
      
      // E11000: 重複キーエラー
      if (mongoError.code === 11000) {
        console.log('重複キーエラー:', mongoError);
        return NextResponse.json(
          { error: 'このメールアドレスは既に登録されています' },
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
          error: errorMessage,
          details: errorDetails
        },
        { status: statusCode }
      );
    }
    
    // 本番環境では一般的なエラーメッセージを返す
    return NextResponse.json(
      { error: 'ユーザー登録に失敗しました' },
      { status: statusCode }
    );
  }
}