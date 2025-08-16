import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import { TokenUtils } from '@/utils/tokenUtils';

export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json();

    if (!token) {
      return NextResponse.json(
        { error: 'トークンが提供されていません' },
        { status: 400 }
      );
    }

    // トークンを検証
    let tokenData;
    try {
      tokenData = TokenUtils.verifyToken(token);
    } catch (error) {
      return NextResponse.json(
        { error: 'トークンが無効または期限切れです' },
        { status: 400 }
      );
    }

    if (tokenData.type !== 'email-confirmation') {
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

    if (user.emailVerified) {
      return NextResponse.json(
        { message: 'メールアドレスは既に確認済みです' },
        { status: 200 }
      );
    }

    // メールアドレスを確認済みに更新
    user.emailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    await user.save();

    return NextResponse.json(
      { message: 'メールアドレスの確認が完了しました' },
      { status: 200 }
    );
  } catch (error) {
    console.error('メール確認エラー:', error);
    return NextResponse.json(
      { error: 'メール確認処理に失敗しました' },
      { status: 500 }
    );
  }
}