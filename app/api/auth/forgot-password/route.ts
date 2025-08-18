import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import emailService from '@/services/email/emailService';
import { TokenUtils } from '@/utils/tokenUtils';

// Edge Runtimeではnodemailerが動作しないため、Node.js Runtimeを使用
export const runtime = 'nodejs';

const forgotPasswordSchema = z.object({
  email: z.string().email('有効なメールアドレスを入力してください'),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // バリデーション
    const validatedData = forgotPasswordSchema.parse(body);

    await dbConnect();

    // ユーザーを検索
    const user = await User.findOne({ 
      email: validatedData.email,
      emailVerified: true 
    });

    // セキュリティのため、ユーザーが存在しない場合でも成功レスポンスを返す
    if (!user) {
      return NextResponse.json(
        { message: 'パスワードリセット用のメールを送信しました（登録されている場合）' },
        { status: 200 }
      );
    }

    // パスワードリセットトークンを生成
    const resetToken = TokenUtils.generatePasswordResetToken(
      (user._id as any).toString(),
      user.email
    );

    // JWTトークンに有効期限があるため、データベースへの保存は不要

    // パスワードリセットメールを送信
    try {
      await emailService.sendPasswordReset(
        user.email,
        user.name,
        resetToken
      );
    } catch (emailError) {
      console.error('パスワードリセットメール送信エラー:', emailError);
    }

    return NextResponse.json(
      { message: 'パスワードリセット用のメールを送信しました（登録されている場合）' },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'バリデーションエラー', details: error.issues },
        { status: 400 }
      );
    }
    
    console.error('パスワードリセット要求エラー:', error);
    return NextResponse.json(
      { error: 'パスワードリセット要求の処理に失敗しました' },
      { status: 500 }
    );
  }
}