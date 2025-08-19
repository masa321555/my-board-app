import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/src/auth';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import { normalizeUser } from '@/utils/dataTransform';

// プロフィール取得
export async function GET(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions) as any;
    
    if (!(session?.user as any)?.id) {
      return NextResponse.json(
        { error: '認証が必要です' },
        { status: 401 }
      );
    }

    await dbConnect();
    
    const user = await User.findById((session.user as any).id).select('-password');
    
    if (!user) {
      return NextResponse.json(
        { error: 'ユーザーが見つかりません' },
        { status: 404 }
      );
    }

    // データを正規化
    const normalizedUser = normalizeUser(user);
    
    return NextResponse.json(normalizedUser);
  } catch (error) {
    console.error('Profile fetch error:', error);
    return NextResponse.json(
      { error: 'プロフィールの取得に失敗しました' },
      { status: 500 }
    );
  }
}

// プロフィール更新
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions) as any;
    
    if (!(session?.user as any)?.id) {
      return NextResponse.json(
        { error: '認証が必要です' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { name, bio, location, website } = body;

    // バリデーション
    if (!name || name.trim().length === 0) {
      return NextResponse.json(
        { error: '名前は必須です' },
        { status: 400 }
      );
    }

    if (name.length > 50) {
      return NextResponse.json(
        { error: '名前は50文字以内で入力してください' },
        { status: 400 }
      );
    }

    if (bio && bio.length > 200) {
      return NextResponse.json(
        { error: '自己紹介は200文字以内で入力してください' },
        { status: 400 }
      );
    }

    if (website && website.length > 0) {
      // URLバリデーション
      try {
        new URL(website);
      } catch {
        return NextResponse.json(
          { error: '有効なURLを入力してください' },
          { status: 400 }
        );
      }
    }

    await dbConnect();

    const updatedUser = await User.findByIdAndUpdate(
      (session.user as any).id,
      {
        name: name.trim(),
        bio: bio?.trim() || '',
        location: location?.trim() || '',
        website: website?.trim() || '',
        updatedAt: new Date(),
      },
      { new: true, runValidators: true }
    ).select('-password');

    if (!updatedUser) {
      return NextResponse.json(
        { error: 'ユーザーが見つかりません' },
        { status: 404 }
      );
    }

    // データを正規化
    const normalizedUser = normalizeUser(updatedUser);
    
    return NextResponse.json({
      message: 'プロフィールを更新しました',
      user: normalizedUser,
    });
  } catch (error) {
    console.error('Profile update error:', error);
    return NextResponse.json(
      { error: 'プロフィールの更新に失敗しました' },
      { status: 500 }
    );
  }
}