import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/models/User.model';
import { TokenUtils } from '@/utils/tokenUtils';
import { emailService } from '@/lib/email/service';

export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json();

    if (!token) {
      return NextResponse.json(
        { 
          success: false,
          error: 'トークンが提供されていません',
          message: 'メール確認リンクが無効です。新規登録からやり直してください。'
        },
        { status: 400 }
      );
    }

    // トークンを検証
    let decoded;
    try {
      decoded = TokenUtils.verifyToken(token);
      if (decoded.type !== 'email-confirmation') {
        throw new Error('Invalid token type');
      }
    } catch (_error) {
      return NextResponse.json(
        { 
          success: false,
          error: '無効または期限切れのトークンです',
          message: 'メール確認リンクが無効または期限切れです。新規登録からやり直してください。'
        },
        { status: 400 }
      );
    }

    if (!decoded) {
      return NextResponse.json(
        { 
          success: false,
          error: '無効または期限切れのトークンです',
          message: 'メール確認リンクが無効または期限切れです。新規登録からやり直してください。'
        },
        { status: 400 }
      );
    }

    await dbConnect();

    // ユーザーを取得
    const user = await User.findOne({
      _id: decoded.userId,
      email: decoded.email,
    });

    if (!user) {
      return NextResponse.json(
        { 
          success: false,
          error: 'ユーザーが見つかりません',
          message: '該当するユーザーが見つかりません。新規登録からやり直してください。'
        },
        { status: 404 }
      );
    }

    // 既に確認済みの場合
    if (user.emailVerified) {
      return NextResponse.json({
        success: true,
        alreadyVerified: true,
        message: 'このメールアドレスは既に確認済みです。ログインしてご利用ください。'
      });
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

    return NextResponse.json({
      success: true,
      message: 'メールアドレスの確認が完了しました！ログインして掲示板をご利用ください。',
      user: {
        email: user.email,
        name: user.name
      }
    });
  } catch (error) {
    console.error('Email verification error:', error);
    
    return NextResponse.json(
      { 
        success: false,
        error: 'メール確認処理に失敗しました',
        message: 'システムエラーが発生しました。しばらく時間をおいてから再度お試しください。'
      },
      { status: 500 }
    );
  }
}

// GETメソッドでもアクセスできるようにする（メールリンクから直接アクセスの場合）
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const token = searchParams.get('token');

  if (!token) {
    // エラーページへリダイレクト
    return NextResponse.redirect(
      new URL('/auth/verify?status=error&message=invalid-token', request.url)
    );
  }

  // 確認ページへリダイレクト（トークンを含めて）
  return NextResponse.redirect(
    new URL(`/auth/verify?token=${encodeURIComponent(token)}`, request.url)
  );
}