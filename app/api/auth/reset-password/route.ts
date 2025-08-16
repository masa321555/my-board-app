import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import { TokenUtils } from '@/utils/tokenUtils';

const resetPasswordSchema = z.object({
  token: z.string(),
  password: z.string().min(6, 'パスワードは6文字以上で入力してください'),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // バリデーション
    const validatedData = resetPasswordSchema.parse(body);

    // トークンを検証
    let tokenData;
    try {
      tokenData = TokenUtils.verifyToken(validatedData.token);
    } catch (error) {
      return NextResponse.json(
        { error: 'トークンが無効または期限切れです' },
        { status: 400 }
      );
    }

    if (tokenData.type !== 'password-reset') {
      return NextResponse.json(
        { error: '無効なトークンタイプです' },
        { status: 400 }
      );
    }

    await dbConnect();

    // ユーザーを取得
    const user = await User.findById(tokenData.userId);

    if (!user) {
      return NextResponse.json(
        { error: 'ユーザーが見つかりません' },
        { status: 404 }
      );
    }

    // トークンが一致するか確認
    if (user.passwordResetToken !== validatedData.token) {
      return NextResponse.json(
        { error: 'トークンが無効です' },
        { status: 400 }
      );
    }

    // トークンの有効期限を確認
    if (user.passwordResetExpires && user.passwordResetExpires < new Date()) {
      return NextResponse.json(
        { error: 'トークンの有効期限が切れています' },
        { status: 400 }
      );
    }

    // 新しいパスワードをハッシュ化
    const hashedPassword = await bcrypt.hash(validatedData.password, 10);

    // パスワードを更新し、リセットトークンをクリア
    user.password = hashedPassword;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    return NextResponse.json(
      { message: 'パスワードがリセットされました' },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'バリデーションエラー', details: error.errors },
        { status: 400 }
      );
    }
    
    console.error('パスワードリセットエラー:', error);
    return NextResponse.json(
      { error: 'パスワードリセットに失敗しました' },
      { status: 500 }
    );
  }
}