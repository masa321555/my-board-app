/**
 * MongoDBのドキュメントをクライアント向けに正規化する
 * _id を id に変換し、必要に応じて他のフィールドも整形
 */

// 汎用的な変換関数
export function normalizeMongoDocument<T extends Record<string, any>>(
  doc: T | null | undefined
): (Omit<T, '_id'> & { id: string }) | T | null {
  if (!doc) return null;
  
  // _idを持つ場合はidに変換
  if ('_id' in doc) {
    const { _id, ...rest } = doc;
    return {
      id: String(_id),
      ...rest,
    };
  }
  
  return doc;
}

// 配列の変換関数
export function normalizeMongoDocuments<T extends Record<string, any>>(
  docs: T[] | null | undefined
): Array<(Omit<T, '_id'> & { id: string }) | T> {
  if (!Array.isArray(docs)) return [];
  
  return docs
    .filter(Boolean) // null/undefinedを除外
    .map(doc => normalizeMongoDocument(doc))
    .filter((doc): doc is NonNullable<ReturnType<typeof normalizeMongoDocument<T>>> => doc !== null);
}

// 投稿データの正規化
export interface NormalizedPost {
  id: string;
  title: string;
  content: string;
  author: {
    id: string;
    name: string;
    email: string;
  } | string; // populate前は文字列ID
  authorName: string;
  createdAt: string;
  updatedAt: string;
}

export function normalizePost(post: any): NormalizedPost | null {
  if (!post) return null;
  
  const normalized = normalizeMongoDocument(post);
  if (!normalized) return null;
  
  // authorフィールドの正規化
  if (normalized.author && typeof normalized.author === 'object' && '_id' in normalized.author) {
    normalized.author = normalizeMongoDocument(normalized.author);
  }
  
  return normalized as NormalizedPost;
}

export function normalizePosts(posts: any[]): NormalizedPost[] {
  if (!Array.isArray(posts)) return [];
  
  return posts
    .map(post => normalizePost(post))
    .filter((post): post is NormalizedPost => post !== null);
}

// ユーザーデータの正規化
export interface NormalizedUser {
  id: string;
  name: string;
  email: string;
  role?: string;
  emailVerified?: boolean;
  bio?: string;
  location?: string;
  website?: string;
  avatar?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export function normalizeUser(user: any): NormalizedUser | null {
  if (!user) return null;
  
  const normalized = normalizeMongoDocument(user);
  if (!normalized) return null;
  
  return normalized as NormalizedUser;
}