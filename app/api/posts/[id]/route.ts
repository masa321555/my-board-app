import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Post from '@/lib/models/Post';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await dbConnect();
    const { content } = await request.json();

    if (!content || content.trim().length === 0) {
      return NextResponse.json({ error: '投稿内容を入力してください' }, { status: 400 });
    }

    if (content.length > 200) {
      return NextResponse.json({ error: '投稿は200文字以内で入力してください' }, { status: 400 });
    }

    const post = await Post.findByIdAndUpdate(
      id,
      { content: content.trim() },
      { new: true, runValidators: true }
    );

    if (!post) {
      return NextResponse.json({ error: '投稿が見つかりません' }, { status: 404 });
    }

    return NextResponse.json(post);
  } catch {
    return NextResponse.json({ error: '投稿の更新に失敗しました' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await dbConnect();
    
    const post = await Post.findByIdAndDelete(id);

    if (!post) {
      return NextResponse.json({ error: '投稿が見つかりません' }, { status: 404 });
    }

    return NextResponse.json({ message: '投稿を削除しました' });
  } catch {
    return NextResponse.json({ error: '投稿の削除に失敗しました' }, { status: 500 });
  }
}