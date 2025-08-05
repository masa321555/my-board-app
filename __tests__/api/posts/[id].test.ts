import { PUT, DELETE } from '@/app/api/posts/[id]/route';
import { NextRequest } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Post from '@/lib/models/Post';

// モックの設定
jest.mock('@/lib/mongodb');
jest.mock('@/lib/models/Post');

describe('/api/posts/[id]', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('PUT /api/posts/[id]', () => {
    const params = { id: '123' };

    it('投稿を更新できる', async () => {
      const mockUpdatedPost = {
        _id: '123',
        content: '更新された投稿',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (Post.findByIdAndUpdate as jest.Mock).mockResolvedValue(mockUpdatedPost);

      const request = new NextRequest('http://localhost:3000/api/posts/123', {
        method: 'PUT',
        body: JSON.stringify({ content: '更新された投稿' }),
      });

      const response = await PUT(request, { params });
      const data = await response.json();

      expect(dbConnect).toHaveBeenCalled();
      expect(Post.findByIdAndUpdate).toHaveBeenCalledWith(
        '123',
        { content: '更新された投稿' },
        { new: true, runValidators: true }
      );
      expect(data).toEqual(mockUpdatedPost);
      expect(response.status).toBe(200);
    });

    it('空の投稿内容の場合エラーを返す', async () => {
      const request = new NextRequest('http://localhost:3000/api/posts/123', {
        method: 'PUT',
        body: JSON.stringify({ content: '' }),
      });

      const response = await PUT(request, { params });
      const data = await response.json();

      expect(data).toEqual({ error: '投稿内容を入力してください' });
      expect(response.status).toBe(400);
      expect(Post.findByIdAndUpdate).not.toHaveBeenCalled();
    });

    it('空白のみの投稿内容の場合エラーを返す', async () => {
      const request = new NextRequest('http://localhost:3000/api/posts/123', {
        method: 'PUT',
        body: JSON.stringify({ content: '   ' }),
      });

      const response = await PUT(request, { params });
      const data = await response.json();

      expect(data).toEqual({ error: '投稿内容を入力してください' });
      expect(response.status).toBe(400);
      expect(Post.findByIdAndUpdate).not.toHaveBeenCalled();
    });

    it('200文字を超える投稿の場合エラーを返す', async () => {
      const longContent = 'あ'.repeat(201);
      const request = new NextRequest('http://localhost:3000/api/posts/123', {
        method: 'PUT',
        body: JSON.stringify({ content: longContent }),
      });

      const response = await PUT(request, { params });
      const data = await response.json();

      expect(data).toEqual({ error: '投稿は200文字以内で入力してください' });
      expect(response.status).toBe(400);
      expect(Post.findByIdAndUpdate).not.toHaveBeenCalled();
    });

    it('投稿内容の前後の空白を除去する', async () => {
      const mockUpdatedPost = {
        _id: '123',
        content: 'トリムされた投稿',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (Post.findByIdAndUpdate as jest.Mock).mockResolvedValue(mockUpdatedPost);

      const request = new NextRequest('http://localhost:3000/api/posts/123', {
        method: 'PUT',
        body: JSON.stringify({ content: '  トリムされた投稿  ' }),
      });

      const response = await PUT(request, { params });
      await response.json();

      expect(Post.findByIdAndUpdate).toHaveBeenCalledWith(
        '123',
        { content: 'トリムされた投稿' },
        { new: true, runValidators: true }
      );
    });

    it('存在しない投稿の場合404エラーを返す', async () => {
      (Post.findByIdAndUpdate as jest.Mock).mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/posts/123', {
        method: 'PUT',
        body: JSON.stringify({ content: '更新内容' }),
      });

      const response = await PUT(request, { params });
      const data = await response.json();

      expect(data).toEqual({ error: '投稿が見つかりません' });
      expect(response.status).toBe(404);
    });

    it('データベース接続に失敗した場合エラーを返す', async () => {
      (dbConnect as jest.Mock).mockRejectedValue(new Error('DB接続エラー'));

      const request = new NextRequest('http://localhost:3000/api/posts/123', {
        method: 'PUT',
        body: JSON.stringify({ content: '更新内容' }),
      });

      const response = await PUT(request, { params });
      const data = await response.json();

      expect(data).toEqual({ error: '投稿の更新に失敗しました' });
      expect(response.status).toBe(500);
    });

    it('投稿の更新に失敗した場合エラーを返す', async () => {
      (Post.findByIdAndUpdate as jest.Mock).mockRejectedValue(new Error('更新エラー'));

      const request = new NextRequest('http://localhost:3000/api/posts/123', {
        method: 'PUT',
        body: JSON.stringify({ content: '更新内容' }),
      });

      const response = await PUT(request, { params });
      const data = await response.json();

      expect(data).toEqual({ error: '投稿の更新に失敗しました' });
      expect(response.status).toBe(500);
    });
  });

  describe('DELETE /api/posts/[id]', () => {
    const params = { id: '123' };

    it('投稿を削除できる', async () => {
      const mockDeletedPost = {
        _id: '123',
        content: '削除される投稿',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (Post.findByIdAndDelete as jest.Mock).mockResolvedValue(mockDeletedPost);

      const request = new NextRequest('http://localhost:3000/api/posts/123', {
        method: 'DELETE',
      });

      const response = await DELETE(request, { params });
      const data = await response.json();

      expect(dbConnect).toHaveBeenCalled();
      expect(Post.findByIdAndDelete).toHaveBeenCalledWith('123');
      expect(data).toEqual({ message: '投稿を削除しました' });
      expect(response.status).toBe(200);
    });

    it('存在しない投稿の場合404エラーを返す', async () => {
      (Post.findByIdAndDelete as jest.Mock).mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/posts/123', {
        method: 'DELETE',
      });

      const response = await DELETE(request, { params });
      const data = await response.json();

      expect(data).toEqual({ error: '投稿が見つかりません' });
      expect(response.status).toBe(404);
    });

    it('データベース接続に失敗した場合エラーを返す', async () => {
      (dbConnect as jest.Mock).mockRejectedValue(new Error('DB接続エラー'));

      const request = new NextRequest('http://localhost:3000/api/posts/123', {
        method: 'DELETE',
      });

      const response = await DELETE(request, { params });
      const data = await response.json();

      expect(data).toEqual({ error: '投稿の削除に失敗しました' });
      expect(response.status).toBe(500);
    });

    it('投稿の削除に失敗した場合エラーを返す', async () => {
      (Post.findByIdAndDelete as jest.Mock).mockRejectedValue(new Error('削除エラー'));

      const request = new NextRequest('http://localhost:3000/api/posts/123', {
        method: 'DELETE',
      });

      const response = await DELETE(request, { params });
      const data = await response.json();

      expect(data).toEqual({ error: '投稿の削除に失敗しました' });
      expect(response.status).toBe(500);
    });
  });
});