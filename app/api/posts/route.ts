import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/src/auth';
import dbConnect from '@/lib/mongodb';
import Post from '@/models/Post';
import { z } from 'zod';
import { normalizePosts, normalizePost } from '@/utils/dataTransform';

// 投稿作成のバリデーションスキーマ
const createPostSchema = z.object({
  title: z.string().min(1).max(100),
  content: z.string().min(1).max(1000),
});

// GET /api/posts - 投稿一覧を取得
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions) as any;
    
    if (!session?.user) {
      return NextResponse.json(
        { error: '認証が必要です' },
        { status: 401 }
      );
    }

    await dbConnect();

    // クエリパラメータから取得
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    // 投稿を取得（新しい順）
    const posts = await Post.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('author', 'name email')
      .lean();

    // 総投稿数を取得
    const total = await Post.countDocuments();

    // データを正規化
    const normalizedPosts = normalizePosts(posts || []);

    return NextResponse.json({
      posts: normalizedPosts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('投稿一覧取得エラー:', error);
    return NextResponse.json(
      { error: '投稿の取得に失敗しました' },
      { status: 500 }
    );
  }
}

// POST /api/posts - 新規投稿を作成
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions) as any;
    
    if (!session?.user) {
      return NextResponse.json(
        { error: '認証が必要です' },
        { status: 401 }
      );
    }

    const body = await request.json();
    
    // バリデーション
    const validatedData = createPostSchema.parse(body);

    await dbConnect();

    // 投稿を作成
    const post = await Post.create({
      title: validatedData.title,
      content: validatedData.content,
      author: session.user.id,
      authorName: session.user.name || 'Unknown',
    });

    // 作成した投稿を返す
    const createdPost = await Post.findById(post._id)
      .populate('author', 'name email')
      .lean();

    // データを正規化
    const normalizedPost = normalizePost(createdPost);

    return NextResponse.json(normalizedPost, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'バリデーションエラー', details: error.issues },
        { status: 400 }
      );
    }
    
    console.error('投稿作成エラー:', error);
    return NextResponse.json(
      { error: '投稿の作成に失敗しました' },
      { status: 500 }
    );
  }
}