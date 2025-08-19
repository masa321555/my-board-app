/**
 * データ正規化ユーティリティ
 * APIレスポンスのデータを一貫した形式に変換する
 */

// 投稿の author フィールドを正規化
export function normalizeAuthor(author: any): { id: string; name: string; email: string } | string {
  // null/undefinedの場合は空の文字列を返す
  if (!author) {
    return '';
  }
  
  // 文字列の場合はそのまま返す
  if (typeof author === 'string') {
    return author;
  }
  
  // ObjectIdの場合（toStringメソッドがある場合）
  if (author._id || author.toString) {
    return {
      id: author._id?.toString() || author.toString(),
      name: author.name || 'Unknown',
      email: author.email || ''
    };
  }
  
  // オブジェクトの場合
  if (typeof author === 'object') {
    return {
      id: author.id || author._id?.toString() || '',
      name: author.name || 'Unknown',
      email: author.email || ''
    };
  }
  
  // その他の場合は空文字列を返す
  return '';
}

// 単一の投稿を正規化
export function normalizePost(post: any): any {
  if (!post) {
    return null;
  }
  
  // MongoDBの_idをidに変換
  const id = post._id?.toString() || post.id || '';
  
  // authorを正規化
  const normalizedAuthor = normalizeAuthor(post.author);
  
  // authorNameを決定
  let authorName = post.authorName || 'Unknown';
  
  // authorがオブジェクトの場合、nameを取得
  if (typeof normalizedAuthor === 'object' && normalizedAuthor.name) {
    authorName = normalizedAuthor.name;
  }
  
  return {
    id,
    title: post.title || '',
    content: post.content || '',
    author: normalizedAuthor,
    authorName,
    createdAt: post.createdAt?.toISOString ? post.createdAt.toISOString() : post.createdAt || new Date().toISOString(),
    updatedAt: post.updatedAt?.toISOString ? post.updatedAt.toISOString() : post.updatedAt || new Date().toISOString(),
  };
}

// 投稿の配列を正規化
export function normalizePosts(posts: any[]): any[] {
  if (!Array.isArray(posts)) {
    console.warn('normalizePosts: 入力が配列ではありません', posts);
    return [];
  }
  
  return posts.map(post => normalizePost(post));
}

// ページネーション情報を正規化
export function normalizePagination(data: any): any {
  return {
    page: Number(data?.page) || 1,
    limit: Number(data?.limit) || 10,
    total: Number(data?.total) || 0,
    totalPages: Number(data?.totalPages) || 0,
  };
}

// APIレスポンス全体を正規化
export function normalizePostsResponse(response: any): any {
  return {
    posts: normalizePosts(response?.posts || []),
    pagination: normalizePagination(response?.pagination || {})
  };
}