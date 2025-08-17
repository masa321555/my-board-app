import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/src/auth';
import dbConnect from '@/lib/mongodb';
import Post from '@/models/Post';

export async function GET(_request: NextRequest) {
  try {
    const session = await auth();
    
    if (!(session?.user as any)?.id) {
      return NextResponse.json(
        { error: '認証が必要です' },
        { status: 401 }
      );
    }
    
    await dbConnect();
    
    // ユーザーの投稿統計を取得
    const userId = (session.user as any).id;
    
    // 全投稿数
    const totalPosts = await Post.countDocuments({ 
      author: userId,
      deleted: { $ne: true }
    });
    
    // 今週の投稿数
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const recentPosts = await Post.countDocuments({
      author: userId,
      createdAt: { $gte: oneWeekAgo },
      deleted: { $ne: true }
    });
    
    // コメント数（仮の値）
    const totalComments = 0; // コメント機能実装後に更新
    
    // プロフィール閲覧数（仮の値）
    const profileViews = 0; // プロフィール閲覧機能実装後に更新
    
    // 最近の投稿を取得
    const recentPostsList = await Post.find({
      author: userId,
      deleted: { $ne: true }
    })
      .sort({ createdAt: -1 })
      .limit(5)
      .select('title createdAt views');
    
    // レスポンスデータを整形
    const stats = {
      totalPosts,
      recentPosts,
      totalComments,
      profileViews
    };
    
    const recentPostsData = recentPostsList.map(post => ({
      id: (post._id as any).toString(),
      title: post.title,
      createdAt: post.createdAt.toISOString(),
      views: post.views || 0,
      comments: 0 // コメント機能実装後に更新
    }));
    
    return NextResponse.json({
      stats,
      recentPosts: recentPostsData
    });
    
  } catch (error) {
    console.error('Dashboard data fetch error:', error);
    return NextResponse.json(
      { error: 'ダッシュボードデータの取得に失敗しました' },
      { status: 500 }
    );
  }
}