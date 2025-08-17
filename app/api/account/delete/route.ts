import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import bcrypt from 'bcryptjs';
import { authOptions } from '@/src/lib/auth-options';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User.model';
import Post from '@/models/Post';

export async function DELETE(request: NextRequest) {
  try {
    // セッションを確認
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: '認証が必要です' },
        { status: 401 }
      );
    }

    // リクエストボディからパスワードを取得
    const { password } = await request.json();
    
    if (!password) {
      return NextResponse.json(
        { error: 'パスワードが必要です' },
        { status: 400 }
      );
    }

    await dbConnect();

    // ユーザーを取得（パスワード含む）
    const user = await User.findById(session.user.id).select('+password');
    
    if (!user) {
      return NextResponse.json(
        { error: 'ユーザーが見つかりません' },
        { status: 404 }
      );
    }

    // パスワードを確認
    const isPasswordValid = await bcrypt.compare(password, user.password);
    
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'パスワードが正しくありません' },
        { status: 400 }
      );
    }

    // トランザクション的な処理（エラーが発生した場合はロールバックが必要）
    try {
      // 1. ユーザーの投稿をすべて削除
      const deletePostsResult = await Post.deleteMany({ author: user._id });
      console.log(`Deleted ${deletePostsResult.deletedCount} posts for user ${user._id}`);

      // 2. ユーザーのコメントを削除（コメント機能がある場合）
      // await Comment.deleteMany({ author: user._id });

      // 3. ユーザーアカウントを削除
      await User.findByIdAndDelete(user._id);
      console.log(`User ${user._id} deleted successfully`);

      // 4. セッションの無効化はクライアント側で実行

      return NextResponse.json({
        message: 'アカウントが正常に削除されました',
        deletedData: {
          posts: deletePostsResult.deletedCount,
        },
      });
    } catch (deleteError) {
      console.error('Account deletion error:', deleteError);
      
      // エラーが発生した場合、部分的な削除が発生している可能性があるため
      // 管理者に通知する必要がある
      return NextResponse.json(
        { 
          error: 'アカウント削除中にエラーが発生しました',
          details: '管理者にお問い合わせください',
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Account delete error:', error);
    return NextResponse.json(
      { error: 'アカウント削除に失敗しました' },
      { status: 500 }
    );
  }
}