import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import dbConnect from '@/lib/db';
import User from '@/models/User.model';
import { authOptions } from '@/auth';
import { emailService } from '@/lib/email/service';
import { TokenUtils } from '@/utils/tokenUtils';

// レート制限のマップ（本番環境ではRedisを使用）
const rateLimitMap = new Map<string, { count: number; resetAt: Date }>();

function checkRateLimit(email: string): boolean {
  const now = new Date();
  const limit = 3; // 1時間に3回まで
  const windowMs = 60 * 60 * 1000; // 1時間

  const record = rateLimitMap.get(email);
  
  if (!record || record.resetAt < now) {
    rateLimitMap.set(email, {
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
  try {
    // セッションを確認
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user?.email) {
      return NextResponse.json(
        { error: '認証が必要です' },
        { status: 401 }
      );
    }

    const { email } = await request.json();
    
    // セッションのメールアドレスと一致するか確認
    if (email !== session.user.email) {
      return NextResponse.json(
        { error: '無効なリクエストです' },
        { status: 400 }
      );
    }

    // レート制限チェック
    if (!checkRateLimit(email)) {
      return NextResponse.json(
        { error: '確認メールの送信回数が制限を超えました。1時間後に再度お試しください。' },
        { status: 429 }
      );
    }

    await dbConnect();

    // ユーザーを取得
    const user = await User.findOne({ email });
    
    if (!user) {
      return NextResponse.json(
        { error: 'ユーザーが見つかりません' },
        { status: 404 }
      );
    }

    // 既に確認済みの場合
    if (user.emailVerified) {
      return NextResponse.json(
        { message: 'メールアドレスは既に確認済みです' },
        { status: 200 }
      );
    }

    // 新しい確認トークンを生成
    const confirmationToken = TokenUtils.generateEmailConfirmationToken(
      user._id.toString(),
      user.email
    );

    // トークンを保存
    user.emailVerificationToken = confirmationToken;
    user.emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24時間後
    await user.save();

    // 開発環境の処理
    if (process.env.NODE_ENV === 'development') {
      console.log('開発環境: メール送信をスキップしました');
      console.log('確認URL:', `${process.env.APP_URL}/api/auth/verify?token=${confirmationToken}`);
      
      return NextResponse.json({
        message: '開発環境のため、メール送信をスキップしました',
        verificationUrl: `${process.env.APP_URL}/api/auth/verify?token=${confirmationToken}`,
      });
    }

    // 確認メールを送信
    const verificationUrl = `${process.env.APP_URL}/api/auth/verify?token=${confirmationToken}`;
    const result = await emailService.sendVerificationEmail(user.email, {
      name: user.name,
      verificationUrl,
    });

    if (!result.success) {
      throw new Error(result.error || 'メール送信に失敗しました');
    }

    return NextResponse.json({
      message: '確認メールを再送信しました',
    });
  } catch (error) {
    console.error('Resend verification error:', error);
    return NextResponse.json(
      { error: 'メールの送信に失敗しました' },
      { status: 500 }
    );
  }
}