import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/mongodb';
import Post from '@/models/Post';
import { z } from 'zod';

// 投稿更新のバリデーションスキーマ
const updatePostSchema = z.object({
  title: z.string().min(1).max(100).optional(),
  content: z.string().min(1).max(1000).optional(),
});

// GET /api/posts/[id] - 個別の投稿を取得
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: '認証が必要です' },
        { status: 401 }
      );
    }

    await dbConnect();

    const post = await Post.findById(id)
      .populate('author', 'name email')
      .lean();

    if (!post) {
      return NextResponse.json(
        { error: '投稿が見つかりません' },
        { status: 404 }
      );
    }

    return NextResponse.json(post);
  } catch (error) {
    console.error('投稿取得エラー:', error);
    return NextResponse.json(
      { error: '投稿の取得に失敗しました' },
      { status: 500 }
    );
  }
}

// PUT /api/posts/[id] - 投稿を更新
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: '認証が必要です' },
        { status: 401 }
      );
    }

    const body = await request.json();
    
    // バリデーション
    const validatedData = updatePostSchema.parse(body);

    await dbConnect();

    // 投稿を取得
    const post = await Post.findById(id);

    if (!post) {
      return NextResponse.json(
        { error: '投稿が見つかりません' },
        { status: 404 }
      );
    }

    // 作成者本人かチェック
    if (post.author.toString() !== session.user.id) {
      return NextResponse.json(
        { error: '編集権限がありません' },
        { status: 403 }
      );
    }

    // 投稿を更新
    if (validatedData.title) post.title = validatedData.title;
    if (validatedData.content) post.content = validatedData.content;
    
    await post.save();

    const updatedPost = await Post.findById(post._id)
      .populate('author', 'name email')
      .lean();

    return NextResponse.json(updatedPost);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'バリデーションエラー', details: error.errors },
        { status: 400 }
      );
    }
    
    console.error('投稿更新エラー:', error);
    return NextResponse.json(
      { error: '投稿の更新に失敗しました' },
      { status: 500 }
    );
  }
}

// DELETE /api/posts/[id] - 投稿を削除
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: '認証が必要です' },
        { status: 401 }
      );
    }

    await dbConnect();

    // 投稿を取得
    const post = await Post.findById(id);

    if (!post) {
      return NextResponse.json(
        { error: '投稿が見つかりません' },
        { status: 404 }
      );
    }

    // 作成者本人かチェック
    if (post.author.toString() !== session.user.id) {
      return NextResponse.json(
        { error: '削除権限がありません' },
        { status: 403 }
      );
    }

    // 投稿を削除
    await post.deleteOne();

    return NextResponse.json(
      { message: '投稿を削除しました' },
      { status: 200 }
    );
  } catch (error) {
    console.error('投稿削除エラー:', error);
    return NextResponse.json(
      { error: '投稿の削除に失敗しました' },
      { status: 500 }
    );
  }
}