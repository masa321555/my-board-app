import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import emailService from '@/services/email/emailService';
import { TokenUtils } from '@/utils/tokenUtils';

// 登録データのバリデーションスキーマ
const registerSchema = z.object({
  email: z.string().email('有効なメールアドレスを入力してください'),
  password: z.string().min(6, 'パスワードは6文字以上で入力してください'),
  name: z.string().min(1, '名前を入力してください'),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // バリデーション
    const validatedData = registerSchema.parse(body);

    await dbConnect();

    // 既存ユーザーチェック
    const existingUser = await User.findOne({ email: validatedData.email });
    
    if (existingUser) {
      return NextResponse.json(
        { error: 'このメールアドレスは既に登録されています' },
        { status: 400 }
      );
    }

    // パスワードをハッシュ化
    const hashedPassword = await bcrypt.hash(validatedData.password, 10);

    // ユーザーを作成
    const user = await User.create({
      email: validatedData.email,
      password: hashedPassword,
      name: validatedData.name,
      emailVerified: false,
    });

    // メール確認トークンを生成
    const confirmationToken = TokenUtils.generateEmailConfirmationToken(
      user._id.toString(),
      user.email
    );

    // JWTトークンに有効期限があるため、データベースへの保存は不要

    // 確認メールを送信
    try {
      await emailService.sendRegistrationConfirmation(
        user.email,
        user.name,
        confirmationToken
      );
    } catch (emailError) {
      console.error('確認メール送信エラー:', emailError);
      // メール送信に失敗してもユーザー登録は成功とする
    }

    return NextResponse.json(
      {
        message: '登録が完了しました。確認メールをご確認ください。',
        userId: user._id.toString(),
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'バリデーションエラー', details: error.issues },
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