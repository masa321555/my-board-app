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

// 投稿スキーマ
export const postSchema = z.object({
  id: z.string(),
  title: z.string(),
  content: z.string(),
  author: z.union([
    z.string(),
    z.object({
      id: z.string(),
      name: z.string(),
      email: z.string(),
    }),
  ]),
  authorName: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type Post = z.infer<typeof postSchema>;

// 投稿一覧レスポンススキーマ
export const postsResponseSchema = z.object({
  posts: z.array(postSchema),
  pagination: z.object({
    page: z.number(),
    limit: z.number(),
    total: z.number(),
    totalPages: z.number(),
  }),
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

// APIレスポンスの検証関数
export function validateResponse<T>(
  schema: z.ZodSchema<T>,
  data: unknown,
  fallback: T
): T {
  const result = schema.safeParse(data);
  
  if (result.success) {
    return result.data;
  }
  
  console.error('スキーマ検証エラー:', result.error);
  return fallback;
}