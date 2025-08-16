import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { auth } from '@/auth';
import dbConnect from '@/lib/db';
import Post from '@/models/Post';

export async function GET(request: NextRequest) {
  try {
    // より安全なセッション取得
    let session;
    try {
      session = await auth();
    } catch (authError) {
      console.error('Auth error:', authError);
      // フォールバック: getServerSessionを使用
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

    // ユーザーの投稿統計を取得
    const userId = session.user.id;
    
    // 全投稿数
    const totalPosts = await Post.countDocuments({ author: userId });
    
    // 今週の投稿数（過去7日間）
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const recentPosts = await Post.countDocuments({
      author: userId,
      createdAt: { $gte: oneWeekAgo }
    });
    
    // 最近の投稿（最新5件）
    const posts = await Post.find({ author: userId })
      .sort({ createdAt: -1 })
      .limit(5)
      .select('title createdAt');
    
    // 投稿データを整形
    const recentPostsData = posts.map(post => ({
      id: post._id.toString(),
      title: post.title,
      createdAt: post.createdAt.toISOString(),
      views: 0, // 今はビュー数の実装がないので0
      comments: 0, // コメント機能が実装されたら更新
    }));

    // 統計データ
    const stats = {
      totalPosts,
      recentPosts,
      totalComments: 0, // コメント機能が実装されたら更新
      profileViews: 0, // プロフィールビュー機能が実装されたら更新
    };

    return NextResponse.json({
      stats,
      recentPosts: recentPostsData,
    });
  } catch (error) {
    console.error('Dashboard data fetch error:', error);
    return NextResponse.json(
      { error: 'データの取得に失敗しました' },
      { status: 500 }
    );
  }
}