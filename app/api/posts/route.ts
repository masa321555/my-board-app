import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Post from '@/lib/models/Post';

export async function GET() {
  try {
    await dbConnect();
    const posts = await Post.find({}).sort({ createdAt: -1 });
    return NextResponse.json(posts);
  } catch {
    return NextResponse.json({ error: '投稿の取得に失敗しました' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    const { content } = await request.json();

    if (!content || content.trim().length === 0) {
      return NextResponse.json({ error: '投稿内容を入力してください' }, { status: 400 });
    }

    if (content.length > 200) {
      return NextResponse.json({ error: '投稿は200文字以内で入力してください' }, { status: 400 });
    }

    const post = await Post.create({ content: content.trim() });
    return NextResponse.json(post, { status: 201 });
  } catch {
    return NextResponse.json({ error: '投稿の作成に失敗しました' }, { status: 500 });
  }
}