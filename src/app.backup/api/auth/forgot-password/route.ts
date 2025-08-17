import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import emailService from '@/services/email/emailService';
import { TokenUtils } from '@/utils/tokenUtils';

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
      (user as any)._id.toString(),
      user.email
    );

    // トークンを保存
    user.passwordResetToken = resetToken;
    user.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1時間後
    await user.save();

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