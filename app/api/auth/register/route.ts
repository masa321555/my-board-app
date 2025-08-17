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
  try {
    const body = await request.json();
    
    console.log('登録リクエスト受信:', { 
      name: body.name, 
      email: body.email, 
      passwordLength: body.password?.length 
    });
    
    // バリデーション
    const validatedData = registerSchema.parse(body);
    console.log('バリデーション成功');

    await dbConnect();

    // 既存ユーザーチェック
    const existingUser = await User.findOne({ email: validatedData.email });
    
    if (existingUser) {
      console.log('既存ユーザーが見つかりました:', validatedData.email);
      return NextResponse.json(
        { error: 'このメールアドレスは既に登録されています' },
        { status: 400 }
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

    // トークンを保存
    (user as any).emailVerificationToken = confirmationToken;
    (user as any).emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24時間後
    await user.save();

    // 確認メールを送信
    try {
      const verificationUrl = `${process.env.APP_URL}/api/auth/verify?token=${confirmationToken}`;
      
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
      console.log('バリデーションエラー詳細:', (error as any).errors);
      return NextResponse.json(
        { 
          error: 'バリデーションエラー', 
          details: (error as any).errors.map((err: any) => ({
            field: err.path.join('.'),
            message: err.message
          }))
        },
        { status: 400 }
      );
    }
    
    console.error('ユーザー登録エラー:', error);
    return NextResponse.json(
      { error: 'ユーザー登録に失敗しました' },
      { status: 500 }
    );
  }
}