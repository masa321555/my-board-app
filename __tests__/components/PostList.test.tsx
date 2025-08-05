import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import PostList from '@/components/PostList';

describe('PostList', () => {
  const mockOnEdit = jest.fn();
  const mockOnDelete = jest.fn();
  
  const mockPosts = [
    {
      _id: '1',
      content: '最初の投稿',
      createdAt: '2024-01-01T10:00:00Z',
      updatedAt: '2024-01-01T10:00:00Z',
    },
    {
      _id: '2',
      content: '2番目の投稿\n改行も含む',
      createdAt: '2024-01-02T12:00:00Z',
      updatedAt: '2024-01-02T14:00:00Z',
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('投稿がない場合、適切なメッセージが表示される', () => {
    render(<PostList posts={[]} onEdit={mockOnEdit} onDelete={mockOnDelete} />);
    
    expect(screen.getByText('まだ投稿がありません')).toBeInTheDocument();
  });

  it('投稿リストが正しく表示される', () => {
    render(<PostList posts={mockPosts} onEdit={mockOnEdit} onDelete={mockOnDelete} />);
    
    expect(screen.getByText('最初の投稿')).toBeInTheDocument();
    expect(screen.getByText('2番目の投稿\n改行も含む')).toBeInTheDocument();
  });

  it('日付が正しくフォーマットされて表示される', () => {
    render(<PostList posts={mockPosts} onEdit={mockOnEdit} onDelete={mockOnDelete} />);
    
    // 最初の投稿（作成日時のみ）
    expect(screen.getByText(/投稿日時: 2024\/01\/01 19:00/)).toBeInTheDocument();
    
    // 2番目の投稿（作成日時と更新日時）
    expect(screen.getByText(/投稿日時: 2024\/01\/02 21:00/)).toBeInTheDocument();
    expect(screen.getByText(/更新日時: 2024\/01\/02 23:00/)).toBeInTheDocument();
  });

  it('編集ボタンをクリックするとonEditが呼ばれる', () => {
    render(<PostList posts={mockPosts} onEdit={mockOnEdit} onDelete={mockOnDelete} />);
    
    const editButtons = screen.getAllByTestId('EditIcon');
    fireEvent.click(editButtons[0]);
    
    expect(mockOnEdit).toHaveBeenCalledWith(mockPosts[0]);
  });

  it('削除ボタンをクリックするとonDeleteが呼ばれる', () => {
    render(<PostList posts={mockPosts} onEdit={mockOnEdit} onDelete={mockOnDelete} />);
    
    const deleteButtons = screen.getAllByTestId('DeleteIcon');
    fireEvent.click(deleteButtons[1]);
    
    expect(mockOnDelete).toHaveBeenCalledWith('2');
  });

  it('複数の投稿の間に区切り線が表示される', () => {
    const { container } = render(<PostList posts={mockPosts} onEdit={mockOnEdit} onDelete={mockOnDelete} />);
    
    const dividers = container.querySelectorAll('hr');
    expect(dividers).toHaveLength(1); // 2つの投稿の間に1つの区切り線
  });

  it('改行を含む投稿内容が正しく表示される', () => {
    const postWithNewlines = [
      {
        _id: '3',
        content: '1行目\n2行目\n3行目',
        createdAt: '2024-01-03T10:00:00Z',
        updatedAt: '2024-01-03T10:00:00Z',
      },
    ];
    
    render(<PostList posts={postWithNewlines} onEdit={mockOnEdit} onDelete={mockOnDelete} />);
    
    const postContent = screen.getByText('1行目\n2行目\n3行目');
    expect(postContent).toHaveStyle({ whiteSpace: 'pre-wrap' });
  });
});