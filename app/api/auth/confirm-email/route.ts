import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User.model';
import { TokenUtils } from '@/utils/tokenUtils';
import { emailService } from '@/lib/email/service';

// Edge Runtimeではnodemailerが動作しないため、Node.js Runtimeを使用
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json(
        { error: '確認トークンが必要です' },
        { status: 400 }
      );
    }

    // トークンを検証
    let decoded;
    try {
      decoded = TokenUtils.verifyToken(token);
      
      // メール確認トークンであることを確認
      if (decoded.type !== 'email-confirmation') {
        throw new Error('Invalid token type');
      }
    } catch (_error) {
      return NextResponse.json(
        { error: '無効または期限切れのトークンです' },
        { status: 400 }
      );
    }

    await dbConnect();

    // ユーザーを取得
    const user = await User.findOne({
      _id: decoded.userId,
      email: decoded.email,
      emailVerificationToken: token,
    });

    if (!user) {
      return NextResponse.json(
        { error: 'ユーザーが見つかりません' },
        { status: 404 }
      );
    }

    // 既に確認済みの場合
    if (user.emailVerified) {
      // サクセスページにリダイレクト
      return NextResponse.redirect(
        new URL('/auth/email-confirmed?status=already-verified', request.url)
      );
    }

    // メールアドレスを確認済みに更新
    user.emailVerified = true;
    await user.save();

    // ウェルカムメールを送信（本番環境のみ）
    if (process.env.NODE_ENV === 'production') {
      try {
        await emailService.sendWelcomeEmail(user.email, {
          name: user.name,
          email: user.email,
        });
      } catch (emailError) {
        console.error('Welcome email error:', emailError);
        // ウェルカムメール送信エラーは無視
      }
    }

    // サクセスページにリダイレクト
    return NextResponse.redirect(
      new URL('/auth/email-confirmed?status=success', request.url)
    );
  } catch (error) {
    console.error('Email confirmation error:', error);
    
    // エラーページにリダイレクト
    return NextResponse.redirect(
      new URL('/auth/email-confirmed?status=error', request.url)
    );
  }
}