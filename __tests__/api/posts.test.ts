import { GET, POST } from '@/app/api/posts/route';
import { NextRequest } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Post from '@/lib/models/Post';

// モックの設定
jest.mock('@/lib/mongodb');
jest.mock('@/lib/models/Post');

describe('/api/posts', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/posts', () => {
    it('投稿一覧を取得できる', async () => {
      const mockPosts = [
        { _id: '1', content: '投稿1', createdAt: new Date(), updatedAt: new Date() },
        { _id: '2', content: '投稿2', createdAt: new Date(), updatedAt: new Date() },
      ];

      const mockSort = jest.fn().mockResolvedValue(mockPosts);
      (Post.find as jest.Mock).mockReturnValue({ sort: mockSort });

      const response = await GET();
      const data = await response.json();

      expect(dbConnect).toHaveBeenCalled();
      expect(Post.find).toHaveBeenCalledWith({});
      expect(mockSort).toHaveBeenCalledWith({ createdAt: -1 });
      expect(data).toEqual(mockPosts);
      expect(response.status).toBe(200);
    });

    it('データベース接続に失敗した場合エラーを返す', async () => {
      (dbConnect as jest.Mock).mockRejectedValue(new Error('DB接続エラー'));

      const response = await GET();
      const data = await response.json();

      expect(data).toEqual({ error: '投稿の取得に失敗しました' });
      expect(response.status).toBe(500);
    });

    it('投稿の取得に失敗した場合エラーを返す', async () => {
      const mockSort = jest.fn().mockRejectedValue(new Error('取得エラー'));
      (Post.find as jest.Mock).mockReturnValue({ sort: mockSort });

      const response = await GET();
      const data = await response.json();

      expect(data).toEqual({ error: '投稿の取得に失敗しました' });
      expect(response.status).toBe(500);
    });
  });

  describe('POST /api/posts', () => {
    it('新しい投稿を作成できる', async () => {
      const mockPost = {
        _id: '1',
        content: '新しい投稿',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (Post.create as jest.Mock).mockResolvedValue(mockPost);

      const request = new NextRequest('http://localhost:3000/api/posts', {
        method: 'POST',
        body: JSON.stringify({ content: '新しい投稿' }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(dbConnect).toHaveBeenCalled();
      expect(Post.create).toHaveBeenCalledWith({ content: '新しい投稿' });
      expect(data).toEqual(mockPost);
      expect(response.status).toBe(201);
    });

    it('空の投稿内容の場合エラーを返す', async () => {
      const request = new NextRequest('http://localhost:3000/api/posts', {
        method: 'POST',
        body: JSON.stringify({ content: '' }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(data).toEqual({ error: '投稿内容を入力してください' });
      expect(response.status).toBe(400);
      expect(Post.create).not.toHaveBeenCalled();
    });

    it('空白のみの投稿内容の場合エラーを返す', async () => {
      const request = new NextRequest('http://localhost:3000/api/posts', {
        method: 'POST',
        body: JSON.stringify({ content: '   ' }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(data).toEqual({ error: '投稿内容を入力してください' });
      expect(response.status).toBe(400);
      expect(Post.create).not.toHaveBeenCalled();
    });

    it('200文字を超える投稿の場合エラーを返す', async () => {
      const longContent = 'あ'.repeat(201);
      const request = new NextRequest('http://localhost:3000/api/posts', {
        method: 'POST',
        body: JSON.stringify({ content: longContent }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(data).toEqual({ error: '投稿は200文字以内で入力してください' });
      expect(response.status).toBe(400);
      expect(Post.create).not.toHaveBeenCalled();
    });

    it('投稿内容の前後の空白を除去する', async () => {
      const mockPost = {
        _id: '1',
        content: 'トリムされた投稿',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (Post.create as jest.Mock).mockResolvedValue(mockPost);

      const request = new NextRequest('http://localhost:3000/api/posts', {
        method: 'POST',
        body: JSON.stringify({ content: '  トリムされた投稿  ' }),
      });

      const response = await POST(request);
      await response.json();

      expect(Post.create).toHaveBeenCalledWith({ content: 'トリムされた投稿' });
    });

    it('データベース接続に失敗した場合エラーを返す', async () => {
      (dbConnect as jest.Mock).mockRejectedValue(new Error('DB接続エラー'));

      const request = new NextRequest('http://localhost:3000/api/posts', {
        method: 'POST',
        body: JSON.stringify({ content: '新しい投稿' }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(data).toEqual({ error: '投稿の作成に失敗しました' });
      expect(response.status).toBe(500);
    });

    it('投稿の作成に失敗した場合エラーを返す', async () => {
      (Post.create as jest.Mock).mockRejectedValue(new Error('作成エラー'));

      const request = new NextRequest('http://localhost:3000/api/posts', {
        method: 'POST',
        body: JSON.stringify({ content: '新しい投稿' }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(data).toEqual({ error: '投稿の作成に失敗しました' });
      expect(response.status).toBe(500);
    });
  });
});