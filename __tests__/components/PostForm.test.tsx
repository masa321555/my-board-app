import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PostForm from '@/components/PostForm';

describe('PostForm', () => {
  const mockOnSubmit = jest.fn();
  const mockOnCancel = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('新規投稿フォーム', () => {
    it('正しくレンダリングされる', () => {
      render(<PostForm onSubmit={mockOnSubmit} />);
      
      expect(screen.getByText('新しい投稿を作成')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('何を投稿しますか？（200文字以内）')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: '投稿' })).toBeInTheDocument();
      expect(screen.getByText('200文字')).toBeInTheDocument();
    });

    it('空の投稿を送信しようとするとエラーが表示される', async () => {
      render(<PostForm onSubmit={mockOnSubmit} />);
      
      const submitButton = screen.getByRole('button', { name: '投稿' });
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText('投稿内容を入力してください')).toBeInTheDocument();
      });
      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it('200文字を超える投稿を送信しようとするとエラーが表示される', async () => {
      const user = userEvent.setup();
      render(<PostForm onSubmit={mockOnSubmit} />);
      
      const textarea = screen.getByPlaceholderText('何を投稿しますか？（200文字以内）');
      const longText = 'あ'.repeat(201);
      
      await user.type(textarea, longText);
      
      expect(screen.getByText('文字数が上限を超えています')).toBeInTheDocument();
      expect(screen.getByText('-1文字')).toBeInTheDocument();
      
      const submitButton = screen.getByRole('button', { name: '投稿' });
      expect(submitButton).toBeDisabled();
    });

    it('正常に投稿を送信できる', async () => {
      mockOnSubmit.mockResolvedValueOnce(undefined);
      const user = userEvent.setup();
      
      render(<PostForm onSubmit={mockOnSubmit} />);
      
      const textarea = screen.getByPlaceholderText('何を投稿しますか？（200文字以内）');
      await user.type(textarea, 'テスト投稿');
      
      const submitButton = screen.getByRole('button', { name: '投稿' });
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith('テスト投稿');
      });
      
      // フォームがクリアされることを確認
      expect(textarea).toHaveValue('');
    });

    it('投稿送信中はボタンが無効化される', async () => {
      mockOnSubmit.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));
      const user = userEvent.setup();
      
      render(<PostForm onSubmit={mockOnSubmit} />);
      
      const textarea = screen.getByPlaceholderText('何を投稿しますか？（200文字以内）');
      await user.type(textarea, 'テスト投稿');
      
      const submitButton = screen.getByRole('button', { name: '投稿' });
      fireEvent.click(submitButton);
      
      expect(submitButton).toHaveTextContent('投稿中...');
      expect(submitButton).toBeDisabled();
    });

    it('投稿送信に失敗した場合エラーが表示される', async () => {
      mockOnSubmit.mockRejectedValueOnce(new Error('送信エラー'));
      const user = userEvent.setup();
      
      render(<PostForm onSubmit={mockOnSubmit} />);
      
      const textarea = screen.getByPlaceholderText('何を投稿しますか？（200文字以内）');
      await user.type(textarea, 'テスト投稿');
      
      const submitButton = screen.getByRole('button', { name: '投稿' });
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText('投稿に失敗しました。もう一度お試しください。')).toBeInTheDocument();
      });
    });
  });

  describe('編集フォーム', () => {
    const editingPost = {
      _id: '1',
      content: '既存の投稿内容',
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    };

    it('編集モードで正しくレンダリングされる', () => {
      render(<PostForm editingPost={editingPost} onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);
      
      expect(screen.getByText('投稿を編集')).toBeInTheDocument();
      expect(screen.getByDisplayValue('既存の投稿内容')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: '更新' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'キャンセル' })).toBeInTheDocument();
    });

    it('キャンセルボタンをクリックするとonCancelが呼ばれる', () => {
      render(<PostForm editingPost={editingPost} onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);
      
      const cancelButton = screen.getByRole('button', { name: 'キャンセル' });
      fireEvent.click(cancelButton);
      
      expect(mockOnCancel).toHaveBeenCalled();
    });

    it('編集内容を送信できる', async () => {
      mockOnSubmit.mockResolvedValueOnce(undefined);
      const user = userEvent.setup();
      
      render(<PostForm editingPost={editingPost} onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);
      
      const textarea = screen.getByDisplayValue('既存の投稿内容');
      await user.clear(textarea);
      await user.type(textarea, '更新された投稿内容');
      
      const submitButton = screen.getByRole('button', { name: '更新' });
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith('更新された投稿内容');
      });
    });
  });

  describe('文字数カウンター', () => {
    it('残り文字数が正しく表示される', async () => {
      const user = userEvent.setup();
      render(<PostForm onSubmit={mockOnSubmit} />);
      
      const textarea = screen.getByPlaceholderText('何を投稿しますか？（200文字以内）');
      
      expect(screen.getByText('200文字')).toBeInTheDocument();
      
      await user.type(textarea, 'テスト'); // 3文字
      expect(screen.getByText('197文字')).toBeInTheDocument();
      
      await user.type(textarea, 'a'.repeat(197)); // 合計200文字
      expect(screen.getByText('0文字')).toBeInTheDocument();
    });
  });
});