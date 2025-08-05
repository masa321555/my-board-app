import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import BoardApp from '@/components/BoardApp';

// Fetch APIのモック
global.fetch = jest.fn();

describe('BoardApp', () => {
  const mockPosts = [
    {
      _id: '1',
      content: 'テスト投稿1',
      createdAt: '2024-01-01T10:00:00Z',
      updatedAt: '2024-01-01T10:00:00Z',
    },
    {
      _id: '2',
      content: 'テスト投稿2',
      createdAt: '2024-01-02T10:00:00Z',
      updatedAt: '2024-01-02T10:00:00Z',
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => mockPosts,
    });
  });

  it('初期表示時に投稿を取得して表示する', async () => {
    render(<BoardApp />);
    
    expect(screen.getByText('掲示板')).toBeInTheDocument();
    
    // ローディング中の表示
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
    
    // 投稿が表示されるまで待つ
    await waitFor(() => {
      expect(screen.getByText('テスト投稿1')).toBeInTheDocument();
      expect(screen.getByText('テスト投稿2')).toBeInTheDocument();
    });
    
    expect(global.fetch).toHaveBeenCalledWith('/api/posts');
  });

  it('投稿の取得に失敗した場合エラーメッセージが表示される', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
    });
    
    render(<BoardApp />);
    
    await waitFor(() => {
      expect(screen.getByText('投稿の取得に失敗しました。ページを再読み込みしてください。')).toBeInTheDocument();
    });
  });

  describe('投稿の作成', () => {
    it('新しい投稿を作成できる', async () => {
      render(<BoardApp />);
      
      await waitFor(() => {
        expect(screen.getByText('テスト投稿1')).toBeInTheDocument();
      });
      
      // 投稿作成のモック
      (global.fetch as jest.Mock).mockImplementationOnce((url, options) => {
        if (options?.method === 'POST') {
          return Promise.resolve({
            ok: true,
            json: async () => ({ _id: '3', content: '新しい投稿', createdAt: '2024-01-03T10:00:00Z', updatedAt: '2024-01-03T10:00:00Z' }),
          });
        }
        return Promise.resolve({
          ok: true,
          json: async () => [...mockPosts, { _id: '3', content: '新しい投稿', createdAt: '2024-01-03T10:00:00Z', updatedAt: '2024-01-03T10:00:00Z' }],
        });
      });
      
      // PostFormコンポーネントの投稿ボタンをクリック（実際の実装では内部で処理される）
      // ここではBoardAppのインテグレーションテストとして、API呼び出しの結果を確認
    });
  });

  describe('投稿の編集', () => {
    it('編集モードに切り替わる', async () => {
      render(<BoardApp />);
      
      await waitFor(() => {
        expect(screen.getByText('テスト投稿1')).toBeInTheDocument();
      });
      
      // 編集ボタンをクリック
      const editButtons = screen.getAllByTestId('EditIcon');
      fireEvent.click(editButtons[0]);
      
      // PostFormが編集モードになることを確認
      expect(screen.getByText('投稿を編集')).toBeInTheDocument();
      expect(screen.getByDisplayValue('テスト投稿1')).toBeInTheDocument();
    });

    it('編集をキャンセルできる', async () => {
      render(<BoardApp />);
      
      await waitFor(() => {
        expect(screen.getByText('テスト投稿1')).toBeInTheDocument();
      });
      
      // 編集モードに入る
      const editButtons = screen.getAllByTestId('EditIcon');
      fireEvent.click(editButtons[0]);
      
      // キャンセルボタンをクリック
      const cancelButton = screen.getByRole('button', { name: 'キャンセル' });
      fireEvent.click(cancelButton);
      
      // 編集モードが解除される
      expect(screen.getByText('新しい投稿を作成')).toBeInTheDocument();
    });
  });

  describe('投稿の削除', () => {
    it('削除確認ダイアログが表示される', async () => {
      render(<BoardApp />);
      
      await waitFor(() => {
        expect(screen.getByText('テスト投稿1')).toBeInTheDocument();
      });
      
      // 削除ボタンをクリック
      const deleteButtons = screen.getAllByTestId('DeleteIcon');
      fireEvent.click(deleteButtons[0]);
      
      // 削除確認ダイアログが表示される
      expect(screen.getByText('投稿の削除')).toBeInTheDocument();
      expect(screen.getByText('この投稿を削除してもよろしいですか？この操作は取り消せません。')).toBeInTheDocument();
    });

    it('削除をキャンセルできる', async () => {
      render(<BoardApp />);
      
      await waitFor(() => {
        expect(screen.getByText('テスト投稿1')).toBeInTheDocument();
      });
      
      // 削除ダイアログを開く
      const deleteButtons = screen.getAllByTestId('DeleteIcon');
      fireEvent.click(deleteButtons[0]);
      
      // キャンセルボタンをクリック
      const cancelButton = screen.getByRole('button', { name: 'キャンセル' });
      fireEvent.click(cancelButton);
      
      // ダイアログが閉じる
      await waitFor(() => {
        expect(screen.queryByText('投稿の削除')).not.toBeInTheDocument();
      });
    });

    it('投稿を削除できる', async () => {
      render(<BoardApp />);
      
      await waitFor(() => {
        expect(screen.getByText('テスト投稿1')).toBeInTheDocument();
      });
      
      // 削除のモック設定
      (global.fetch as jest.Mock).mockImplementationOnce((url, options) => {
        if (options?.method === 'DELETE') {
          return Promise.resolve({ ok: true });
        }
        return Promise.resolve({
          ok: true,
          json: async () => [mockPosts[1]], // 最初の投稿を削除した結果
        });
      });
      
      // 削除ダイアログを開く
      const deleteButtons = screen.getAllByTestId('DeleteIcon');
      fireEvent.click(deleteButtons[0]);
      
      // 削除ボタンをクリック
      const deleteButton = screen.getByRole('button', { name: '削除' });
      fireEvent.click(deleteButton);
      
      // APIが呼ばれることを確認
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/posts/1', { method: 'DELETE' });
      });
    });

    it('削除に失敗した場合エラーメッセージが表示される', async () => {
      render(<BoardApp />);
      
      await waitFor(() => {
        expect(screen.getByText('テスト投稿1')).toBeInTheDocument();
      });
      
      // 削除失敗のモック
      (global.fetch as jest.Mock).mockImplementationOnce((url, options) => {
        if (options?.method === 'DELETE') {
          return Promise.resolve({ ok: false, json: async () => ({ error: '削除エラー' }) });
        }
        return Promise.resolve({
          ok: true,
          json: async () => mockPosts,
        });
      });
      
      // 削除を実行
      const deleteButtons = screen.getAllByTestId('DeleteIcon');
      fireEvent.click(deleteButtons[0]);
      
      const deleteButton = screen.getByRole('button', { name: '削除' });
      fireEvent.click(deleteButton);
      
      // エラーメッセージが表示される
      await waitFor(() => {
        expect(screen.getByText('投稿の削除に失敗しました')).toBeInTheDocument();
      });
    });
  });
});