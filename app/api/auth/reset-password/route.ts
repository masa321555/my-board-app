import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import { TokenUtils } from '@/utils/tokenUtils';

// Edge Runtimeではbcryptjsが動作しないため、Node.js Runtimeを使用
export const runtime = 'nodejs';

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
    } catch (_error) {
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

    // JWTトークンの検証で十分なため、追加のチェックは不要

    // 新しいパスワードをハッシュ化
    const hashedPassword = await bcrypt.hash(validatedData.password, 10);

    // パスワードを更新
    user.password = hashedPassword;
    await user.save();

    return NextResponse.json(
      { message: 'パスワードがリセットされました' },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'バリデーションエラー', details: error.issues },
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