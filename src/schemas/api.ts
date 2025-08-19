import { z } from 'zod';

// ユーザースキーマ
export const userSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email(),
  role: z.string().optional(),
  emailVerified: z.boolean().optional(),
  bio: z.string().optional(),
  location: z.string().optional(),
  website: z.string().optional(),
  avatar: z.string().nullable().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export type User = z.infer<typeof userSchema>;

// 著者スキーマ（堅牢版）
export const authorSchema = z.union([
  z.string().min(1),
  z.object({
    id: z.string().optional(),
    name: z.string().min(1),
    email: z.string().optional(),
  })
]).nullable().optional().transform((val) => {
  // null/undefinedの場合は空文字列を返す
  if (!val) return '';
  
  // すでに正規化されている場合はそのまま返す
  return val;
});

// 投稿スキーマ（堅牢版）
export const postSchema = z.object({
  id: z.string(),
  title: z.string().min(1).default(''),
  content: z.string().default(''),
  author: authorSchema,
  authorName: z.string().min(1).default('Unknown'),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type Post = z.infer<typeof postSchema>;

// 投稿一覧レスポンススキーマ（堅牢版）
export const postsResponseSchema = z.object({
  posts: z.array(postSchema).default([]),
  pagination: z.object({
    page: z.number().default(1),
    limit: z.number().default(10),
    total: z.number().default(0),
    totalPages: z.number().default(0),
  }).default({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  }),
}).transform((data) => {
  // データが正しく構造化されていることを保証
  return {
    posts: data.posts || [],
    pagination: data.pagination || {
      page: 1,
      limit: 10,
      total: 0,
      totalPages: 0
    }
  };
});

export type PostsResponse = z.infer<typeof postsResponseSchema>;

// ダッシュボードレスポンススキーマ
export const dashboardResponseSchema = z.object({
  stats: z.object({
    totalPosts: z.number(),
    recentPosts: z.number(),
    totalComments: z.number(),
    profileViews: z.number(),
  }),
  recentPosts: z.array(
    z.object({
      id: z.string(),
      title: z.string(),
      createdAt: z.string(),
      views: z.number(),
      comments: z.number(),
    })
  ),
});

export type DashboardResponse = z.infer<typeof dashboardResponseSchema>;

// APIレスポンスの検証関数（詳細なエラーログ付き）
export function validateResponse<T>(
  schema: z.ZodSchema<T>,
  data: unknown,
  fallback: T,
  context?: string
): T {
  try {
    const result = schema.safeParse(data);
    
    if (result.success) {
      return result.data;
    }
    
    // 詳細なエラーログ
    console.error(`[Schema Validation Error]${context ? ` in ${context}` : ''}:`, {
      errors: result.error.issues.map(issue => ({
        path: issue.path.join('.'),
        message: issue.message,
        code: issue.code,
        expected: (issue as any).expected,
        received: (issue as any).received,
      })),
      rawData: JSON.stringify(data, null, 2).substring(0, 500) + '...',
    });
    
    return fallback;
  } catch (error) {
    console.error(`[Schema Validation Exception]${context ? ` in ${context}` : ''}:`, error);
    return fallback;
  }
}