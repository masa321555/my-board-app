import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import dbConnect from '@/lib/db';
import User from '@/models/User.model';
import { emailService } from '@/lib/email/service';
import { TokenUtils } from '@/utils/tokenUtils';
import { registerSchema } from '@/schemas/auth';
import { checkPasswordStrength } from '@/utils/passwordStrength';

export async function POST(request: NextRequest) {
  console.log('=== 登録API開始 ===');
  console.log('NODE_ENV:', process.env.NODE_ENV);
  console.log('MONGODB_URI 設定:', !!process.env.MONGODB_URI);
  console.log('JWT_SECRET 設定:', !!process.env.JWT_SECRET);
  console.log('APP_URL:', process.env.APP_URL);
  console.log('VERCEL_URL:', process.env.VERCEL_URL);
  console.log('EMAIL_PROVIDER:', process.env.EMAIL_PROVIDER);
  
  try {
    const body = await request.json();
    
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

    console.log('MongoDB接続開始...');
    await dbConnect();
    console.log('MongoDB接続成功');

    // 既存ユーザーチェック（一時的に無効化）
    const existingUser = await User.findOne({ email: validatedData.email });
    
    if (existingUser) {
      console.log('既存ユーザーが見つかりました。削除します:', validatedData.email);
      await User.deleteOne({ email: validatedData.email });
      console.log('既存ユーザーを削除しました');
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
    try {
      // APP_URLが未設定の場合のフォールバック
      const appUrl = process.env.APP_URL || 
        (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');
      const verificationUrl = `${appUrl}/api/auth/verify?token=${confirmationToken}`;
      
      // 開発環境ではメール送信をスキップ
      if (isDevelopment) {
        console.log('開発環境: メール送信をスキップしました');
        console.log('確認URL:', verificationUrl);
      } else {
        await emailService.sendVerificationEmail(user.email, {
          name: user.name,
          verificationUrl,
        });
      }
    } catch (emailError) {
      console.error('確認メール送信エラー:', emailError);
      // メール送信に失敗してもユーザー登録は成功とする
      console.log('メール送信は失敗しましたが、ユーザー登録は継続します');
    }

    return NextResponse.json(
      {
        message: isDevelopment 
          ? '登録が完了しました。開発環境のため、メール確認は自動的に完了しています。'
          : '登録が完了しました。確認メールをご確認ください。',
        userId: (user as any)._id.toString(),
        emailVerified: user.emailVerified,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('登録エラーの詳細:', error);
    
    if (error instanceof z.ZodError) {
      const zodError = error as any;
      console.log('バリデーションエラー詳細:', zodError.errors);
      return NextResponse.json(
        { 
          error: 'バリデーションエラー', 
          details: zodError.errors.map((err: any) => ({
            field: err.path.join('.'),
            message: err.message
          }))
        },
        { status: 400 }
      );
    }
    
    // 詳細なエラー情報をログに出力
    let errorMessage = 'ユーザー登録に失敗しました';
    const errorDetails: any = {};
    
    if (error instanceof Error) {
      errorMessage = error.message;
      errorDetails.stack = error.stack;
      
      // MongoDB接続エラーの場合
      if (error.message.includes('MONGODB_URI')) {
        errorMessage = 'データベース接続エラー';
        errorDetails.type = 'DATABASE_CONNECTION_ERROR';
      }
      // メール設定エラーの場合
      else if (error.message.includes('credentials not configured')) {
        errorMessage = 'メール設定エラー';
        errorDetails.type = 'EMAIL_CONFIGURATION_ERROR';
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
        { status: 500 }
      );
    }
    
    // 本番環境では一般的なエラーメッセージを返す
    return NextResponse.json(
      { error: 'ユーザー登録に失敗しました' },
      { status: 500 }
    );
  }
}