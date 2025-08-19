import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/src/auth';
import dbConnect from '@/lib/db';
import User from '@/models/User';

// Node.jsランタイムを指定（Edge Runtimeでは動作しない）
export const runtime = 'nodejs';
export const maxDuration = 60; // タイムアウト対策（60秒）

// アバター画像のアップロード
export async function POST(request: NextRequest) {
  let userId: string | null = null;
  
  try {
    // 1. 認証チェック
    const session = await getServerSession(authOptions) as any;
    userId = session?.user?.id || (session?.user as any)?.id;
    
    if (!userId) {
      return NextResponse.json(
        { 
          ok: false, 
          code: 'UNAUTHORIZED', 
          message: '認証が必要です',
          requestId: crypto.randomUUID()
        },
        { status: 401 }
      );
    }

    // 2. FormDataの取得
    let formData: FormData;
    try {
      formData = await request.formData();
    } catch (_error) {
      return NextResponse.json(
        { 
          ok: false, 
          code: 'INVALID_REQUEST', 
          message: 'FormDataの解析に失敗しました',
          requestId: crypto.randomUUID()
        },
        { status: 400 }
      );
    }

    // 3. ファイルの取得（"file"フィールドとして送信される）
    const file = formData.get('file') as File | null;
    
    if (!file) {
      // 互換性のため "avatar" フィールドも確認
      const avatarFile = formData.get('avatar') as File | null;
      if (!avatarFile) {
        return NextResponse.json(
          { 
            ok: false, 
            code: 'NO_FILE', 
            message: 'ファイルがアップロードされていません',
            requestId: crypto.randomUUID()
          },
          { status: 400 }
        );
      }
    }

    const uploadFile = file || (formData.get('avatar') as File);

    // 4. ファイルサイズのチェック（2MB以下）
    const maxSize = 2 * 1024 * 1024; // 2MB
    if (uploadFile.size > maxSize) {
      return NextResponse.json(
        { 
          ok: false, 
          code: 'FILE_TOO_LARGE', 
          message: 'ファイルサイズは2MB以下にしてください',
          requestId: crypto.randomUUID()
        },
        { status: 413 } // Payload Too Large
      );
    }

    // 5. ファイルタイプのチェック
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(uploadFile.type)) {
      return NextResponse.json(
        { 
          ok: false, 
          code: 'UNSUPPORTED_MEDIA_TYPE', 
          message: '画像ファイル（JPEG、PNG、WebP）のみアップロードできます',
          requestId: crypto.randomUUID()
        },
        { status: 415 } // Unsupported Media Type
      );
    }

    // 6. 画像データの取得
    const bytes = await uploadFile.arrayBuffer();
    const _buffer = Buffer.from(bytes); // TODO: Vercel Blobアップロード時に使用

    // 7. ファイル名の生成（安全な名前）
    const timestamp = Date.now();
    const extension = uploadFile.type.split('/')[1];
    const safeFileName = `${userId}/${timestamp}.${extension}`;

    // TODO: Vercel Blobへのアップロード実装
    // 現在は仮のURLを返す
    const avatarUrl = `/uploads/avatars/${safeFileName}`;

    // 8. データベースの更新
    await dbConnect();
    
    // 新しいアバターURLを保存
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        avatar: avatarUrl,
        updatedAt: new Date(),
      },
      { new: true }
    ).select('-password');

    if (!updatedUser) {
      return NextResponse.json(
        { 
          ok: false, 
          code: 'USER_NOT_FOUND', 
          message: 'ユーザーが見つかりません',
          requestId: crypto.randomUUID()
        },
        { status: 404 }
      );
    }

    // 9. 成功レスポンス
    return NextResponse.json({
      ok: true,
      message: 'アバター画像をアップロードしました',
      avatarUrl,
      requestId: crypto.randomUUID()
    }, { status: 201 });

  } catch (error) {
    console.error('Avatar upload error:', error);
    
    // エラーの種類に応じた適切なステータスコードを返す
    const requestId = crypto.randomUUID();
    
    if (error instanceof Error) {
      // MongoDB接続エラー
      if (error.message.includes('connect')) {
        return NextResponse.json(
          { 
            ok: false, 
            code: 'DATABASE_ERROR', 
            message: 'データベース接続エラー',
            requestId
          },
          { status: 503 } // Service Unavailable
        );
      }
    }
    
    // その他の予期しないエラー
    return NextResponse.json(
      { 
        ok: false, 
        code: 'INTERNAL_ERROR', 
        message: 'アバター画像のアップロードに失敗しました',
        requestId
      },
      { status: 500 }
    );
  }
}

// アバター画像の削除
export async function DELETE(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions) as any;
    const userId = session?.user?.id || (session?.user as any)?.id;
    
    if (!userId) {
      return NextResponse.json(
        { 
          ok: false, 
          code: 'UNAUTHORIZED', 
          message: '認証が必要です',
          requestId: crypto.randomUUID()
        },
        { status: 401 }
      );
    }

    await dbConnect();
    
    // データベースからアバターを削除
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        avatar: null,
        updatedAt: new Date(),
      },
      { new: true }
    ).select('-password');

    if (!updatedUser) {
      return NextResponse.json(
        { 
          ok: false, 
          code: 'USER_NOT_FOUND', 
          message: 'ユーザーが見つかりません',
          requestId: crypto.randomUUID()
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      ok: true,
      message: 'アバター画像を削除しました',
      requestId: crypto.randomUUID()
    });
  } catch (error) {
    console.error('Avatar delete error:', error);
    return NextResponse.json(
      { 
        ok: false, 
        code: 'INTERNAL_ERROR', 
        message: 'アバター画像の削除に失敗しました',
        requestId: crypto.randomUUID()
      },
      { status: 500 }
    );
  }
}