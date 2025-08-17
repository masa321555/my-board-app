import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { auth } from '@/auth';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import { processImage } from '@/lib/imageUtils';
import { v4 as uuidv4 } from 'uuid';
import { writeFile, unlink } from 'fs/promises';
import { join } from 'path';
import { existsSync, mkdirSync } from 'fs';

// アバター画像のアップロード
export async function POST(request: NextRequest) {
  try {
    let session;
    try {
      session = await auth();
    } catch (authError) {
      console.error('Auth error:', authError);
      const { authOptions } = await import('@/lib/auth-options');
      session = await getServerSession(authOptions);
    }
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: '認証が必要です' },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('avatar') as File;
    
    if (!file) {
      return NextResponse.json(
        { error: 'ファイルがアップロードされていません' },
        { status: 400 }
      );
    }

    // ファイルサイズのチェック（5MB以下）
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'ファイルサイズは5MB以下にしてください' },
        { status: 400 }
      );
    }

    // ファイルタイプのチェック
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: '画像ファイル（JPEG、PNG、WebP）のみアップロードできます' },
        { status: 400 }
      );
    }

    // 画像をバッファに変換
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // 画像を処理（リサイズ、フォーマット変換）
    const processedImage = await processImage(buffer, {
      width: 400,
      height: 400,
      quality: 85,
      format: 'jpeg',
    });

    // ローカルファイルシステムに保存
    const uploadDir = join(process.cwd(), 'public', 'uploads', 'avatars');
    if (!existsSync(uploadDir)) {
      mkdirSync(uploadDir, { recursive: true });
    }

    const fileName = `${session.user.id}_${uuidv4()}.jpg`;
    const filePath = join(uploadDir, fileName);
    
    await writeFile(filePath, processedImage);

    // アバターURLを生成
    const avatarUrl = `/uploads/avatars/${fileName}`;

    // データベースの更新
    await dbConnect();
    
    // 古いアバターのパスを取得（後で削除するため）
    const oldUser = await User.findById(session.user.id).select('avatar');
    const oldAvatarPath = oldUser?.avatar?.startsWith('/uploads/avatars/') 
      ? join(process.cwd(), 'public', oldUser.avatar)
      : null;
    
    // 新しいアバターURLを保存
    const updatedUser = await User.findByIdAndUpdate(
      session.user.id,
      {
        avatar: avatarUrl,
        updatedAt: new Date(),
      },
      { new: true }
    ).select('-password');

    if (!updatedUser) {
      return NextResponse.json(
        { error: 'ユーザーが見つかりません' },
        { status: 404 }
      );
    }

    // 古いアバターがローカルにある場合は削除
    if (oldAvatarPath && existsSync(oldAvatarPath)) {
      try {
        await unlink(oldAvatarPath);
      } catch (error) {
        console.error('Failed to delete old avatar:', error);
        // 古い画像の削除に失敗してもエラーにはしない
      }
    }

    return NextResponse.json({
      message: 'アバター画像をアップロードしました',
      avatarUrl,
    });
  } catch (error) {
    console.error('Avatar upload error:', error);
    return NextResponse.json(
      { error: 'アバター画像のアップロードに失敗しました' },
      { status: 500 }
    );
  }
}

// アバター画像の削除
export async function DELETE(_request: NextRequest) {
  try {
    let session;
    try {
      session = await auth();
    } catch (authError) {
      console.error('Auth error:', authError);
      const { authOptions } = await import('@/lib/auth-options');
      session = await getServerSession(authOptions);
    }
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: '認証が必要です' },
        { status: 401 }
      );
    }

    await dbConnect();
    
    // 現在のアバター情報を取得
    const user = await User.findById(session.user.id).select('avatar');
    
    if (user?.avatar && user.avatar.startsWith('/uploads/avatars/')) {
      // ローカルファイルパスを生成
      const avatarPath = join(process.cwd(), 'public', user.avatar);
      
      if (existsSync(avatarPath)) {
        try {
          await unlink(avatarPath);
        } catch (error) {
          console.error('Failed to delete avatar from local storage:', error);
        }
      }
    }
    
    // データベースからアバターを削除
    const updatedUser = await User.findByIdAndUpdate(
      session.user.id,
      {
        avatar: null,
        updatedAt: new Date(),
      },
      { new: true }
    ).select('-password');

    if (!updatedUser) {
      return NextResponse.json(
        { error: 'ユーザーが見つかりません' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: 'アバター画像を削除しました',
    });
  } catch (error) {
    console.error('Avatar delete error:', error);
    return NextResponse.json(
      { error: 'アバター画像の削除に失敗しました' },
      { status: 500 }
    );
  }
}