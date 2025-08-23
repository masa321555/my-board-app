# SNS機能設計書

## 1. 概要
既存の掲示板アプリケーションにSNS機能を追加し、ユーザー間のより豊かなインタラクションを実現します。

### 追加される主要機能
- ユーザーフォロー/フォロワー機能
- タイムライン（フォローした人の投稿表示）
- いいね機能
- コメント機能
- 通知システム

## 2. データベース設計

### 2.1 新規コレクション

#### Follows（フォロー関係）
```javascript
{
  _id: ObjectId,
  follower: ObjectId,     // フォローする人のUser ID
  following: ObjectId,    // フォローされる人のUser ID
  createdAt: Date,
  updatedAt: Date
}
```
インデックス:
- `{ follower: 1, following: 1 }` (複合ユニークインデックス)
- `{ follower: 1, createdAt: -1 }`
- `{ following: 1, createdAt: -1 }`

#### Likes（いいね）
```javascript
{
  _id: ObjectId,
  user: ObjectId,         // いいねしたユーザーのID
  targetType: String,     // 'post' or 'comment'
  targetId: ObjectId,     // PostまたはCommentのID
  createdAt: Date,
  updatedAt: Date
}
```
インデックス:
- `{ user: 1, targetType: 1, targetId: 1 }` (複合ユニークインデックス)
- `{ targetType: 1, targetId: 1 }`
- `{ user: 1, createdAt: -1 }`

#### Comments（コメント）
```javascript
{
  _id: ObjectId,
  content: String,        // コメント内容
  author: ObjectId,       // コメント投稿者のUser ID
  authorName: String,     // 投稿者名（パフォーマンス向上のため非正規化）
  postId: ObjectId,       // 対象のPost ID
  parentCommentId: ObjectId, // 返信の場合の親コメントID（オプション）
  likes: Number,          // いいね数（集計値をキャッシュ）
  createdAt: Date,
  updatedAt: Date,
  deletedAt: Date        // ソフトデリート用
}
```
インデックス:
- `{ postId: 1, createdAt: -1 }`
- `{ author: 1, createdAt: -1 }`
- `{ parentCommentId: 1 }`

#### Notifications（通知）
```javascript
{
  _id: ObjectId,
  recipient: ObjectId,    // 通知を受け取るユーザーのID
  sender: ObjectId,       // 通知を発生させたユーザーのID
  type: String,           // 'follow', 'like', 'comment', 'mention'
  targetType: String,     // 'post', 'comment', etc.
  targetId: ObjectId,     // 関連するリソースのID
  message: String,        // 通知メッセージ
  read: Boolean,          // 既読フラグ
  readAt: Date,          // 既読日時
  createdAt: Date,
  updatedAt: Date
}
```
インデックス:
- `{ recipient: 1, read: 1, createdAt: -1 }`
- `{ recipient: 1, type: 1, createdAt: -1 }`

### 2.2 既存コレクションの更新

#### User（追加フィールド）
```javascript
{
  // 既存フィールド...
  
  // SNS機能用追加フィールド
  followersCount: Number,    // フォロワー数（キャッシュ）
  followingCount: Number,    // フォロー数（キャッシュ）
  postsCount: Number,        // 投稿数（キャッシュ）
  isPrivate: Boolean,        // 非公開アカウント設定
  notificationSettings: {
    follow: Boolean,         // フォロー通知
    like: Boolean,          // いいね通知
    comment: Boolean,       // コメント通知
    mention: Boolean        // メンション通知
  }
}
```

#### Post（追加フィールド）
```javascript
{
  // 既存フィールド...
  
  // SNS機能用追加フィールド
  likesCount: Number,        // いいね数（キャッシュ）
  commentsCount: Number,     // コメント数（キャッシュ）
  visibility: String,        // 'public', 'followers', 'private'
  mentions: [ObjectId],      // メンションされたユーザーID配列
  hashtags: [String]         // ハッシュタグ配列
}
```

## 3. API設計

### 3.1 フォロー関連API

#### POST /api/users/:userId/follow
ユーザーをフォローする
```typescript
// Request Body
{}

// Response
{
  success: boolean,
  following: boolean,
  followersCount: number,
  followingCount: number
}
```

#### DELETE /api/users/:userId/follow
フォローを解除する
```typescript
// Response
{
  success: boolean,
  following: false,
  followersCount: number,
  followingCount: number
}
```

#### GET /api/users/:userId/followers
フォロワー一覧を取得
```typescript
// Query Parameters
{
  page?: number,
  limit?: number
}

// Response
{
  followers: User[],
  total: number,
  page: number,
  totalPages: number
}
```

#### GET /api/users/:userId/following
フォロー中のユーザー一覧を取得
```typescript
// Query Parameters
{
  page?: number,
  limit?: number
}

// Response
{
  following: User[],
  total: number,
  page: number,
  totalPages: number
}
```

### 3.2 タイムライン関連API

#### GET /api/timeline
自分のタイムラインを取得
```typescript
// Query Parameters
{
  page?: number,
  limit?: number,
  type?: 'all' | 'following' | 'popular'
}

// Response
{
  posts: Post[],
  total: number,
  page: number,
  totalPages: number
}
```

#### GET /api/users/:userId/posts
特定ユーザーの投稿一覧を取得
```typescript
// Query Parameters
{
  page?: number,
  limit?: number
}

// Response
{
  posts: Post[],
  total: number,
  page: number,
  totalPages: number
}
```

### 3.3 いいね関連API

#### POST /api/posts/:postId/like
投稿にいいねする
```typescript
// Request Body
{}

// Response
{
  success: boolean,
  liked: boolean,
  likesCount: number
}
```

#### DELETE /api/posts/:postId/like
いいねを取り消す
```typescript
// Response
{
  success: boolean,
  liked: false,
  likesCount: number
}
```

#### GET /api/posts/:postId/likes
いいねしたユーザー一覧を取得
```typescript
// Query Parameters
{
  page?: number,
  limit?: number
}

// Response
{
  users: User[],
  total: number,
  page: number,
  totalPages: number
}
```

### 3.4 コメント関連API

#### POST /api/posts/:postId/comments
コメントを投稿
```typescript
// Request Body
{
  content: string,
  parentCommentId?: string
}

// Response
{
  comment: Comment
}
```

#### GET /api/posts/:postId/comments
コメント一覧を取得
```typescript
// Query Parameters
{
  page?: number,
  limit?: number,
  sort?: 'newest' | 'oldest' | 'popular'
}

// Response
{
  comments: Comment[],
  total: number,
  page: number,
  totalPages: number
}
```

#### PUT /api/comments/:commentId
コメントを編集
```typescript
// Request Body
{
  content: string
}

// Response
{
  comment: Comment
}
```

#### DELETE /api/comments/:commentId
コメントを削除（ソフトデリート）
```typescript
// Response
{
  success: boolean
}
```

### 3.5 通知関連API

#### GET /api/notifications
通知一覧を取得
```typescript
// Query Parameters
{
  page?: number,
  limit?: number,
  unreadOnly?: boolean
}

// Response
{
  notifications: Notification[],
  total: number,
  unreadCount: number,
  page: number,
  totalPages: number
}
```

#### PUT /api/notifications/:notificationId/read
通知を既読にする
```typescript
// Response
{
  success: boolean,
  notification: Notification
}
```

#### PUT /api/notifications/read-all
すべての通知を既読にする
```typescript
// Response
{
  success: boolean,
  readCount: number
}
```

#### GET /api/notifications/unread-count
未読通知数を取得
```typescript
// Response
{
  count: number
}
```

## 4. UI/UXコンポーネント設計

### 4.1 新規コンポーネント

#### FollowButton
```typescript
interface FollowButtonProps {
  userId: string;
  isFollowing?: boolean;
  onFollowChange?: (isFollowing: boolean) => void;
}
```

#### Timeline
```typescript
interface TimelineProps {
  type: 'all' | 'following' | 'user';
  userId?: string;
}
```

#### LikeButton
```typescript
interface LikeButtonProps {
  targetType: 'post' | 'comment';
  targetId: string;
  initialLiked?: boolean;
  initialCount?: number;
  onLikeChange?: (liked: boolean, count: number) => void;
}
```

#### CommentSection
```typescript
interface CommentSectionProps {
  postId: string;
  allowReplies?: boolean;
}
```

#### NotificationBell
```typescript
interface NotificationBellProps {
  userId: string;
}
```

#### UserProfileHeader
```typescript
interface UserProfileHeaderProps {
  user: User;
  isOwnProfile: boolean;
}
```

### 4.2 ページ構成

#### /profile/[userId]
ユーザープロフィールページ
- ユーザー情報表示
- フォロー/フォロワー数表示
- フォローボタン（他人のプロフィールの場合）
- 投稿一覧
- タブ切り替え（投稿/いいね/メディア）

#### /timeline
タイムラインページ
- タイムライン表示
- フィルター（すべて/フォロー中/人気）
- 無限スクロール

#### /notifications
通知ページ
- 通知一覧
- 既読/未読フィルター
- 一括既読ボタン

## 5. 実装計画とマイルストーン

### Phase 1: 基盤構築（2週間）
- [ ] データベーススキーマの実装
- [ ] 基本的なAPI実装（フォロー、いいね）
- [ ] 認証とセキュリティの実装

### Phase 2: コア機能実装（3週間）
- [ ] タイムライン機能の実装
- [ ] コメント機能の実装
- [ ] 通知システムの基本実装

### Phase 3: UI実装（3週間）
- [ ] コンポーネントの実装
- [ ] ページの実装
- [ ] レスポンシブ対応

### Phase 4: 最適化と品質向上（2週間）
- [ ] パフォーマンス最適化
- [ ] リアルタイム通知（WebSocket）
- [ ] テストの実装
- [ ] バグ修正

## 6. 技術的考慮事項

### 6.1 パフォーマンス最適化
- カウンター（フォロワー数、いいね数など）のキャッシュ
- 適切なインデックスの設定
- ページネーションの実装
- 画像の遅延読み込み

### 6.2 セキュリティ
- プライベートアカウントの権限チェック
- レート制限の実装
- XSS対策（コメント内容のサニタイズ）

### 6.3 スケーラビリティ
- MongoDBのシャーディング対応設計
- Redis導入の検討（セッション、キャッシュ）
- 画像CDNの活用

### 6.4 リアルタイム機能
- Socket.ioまたはServer-Sent Eventsの導入検討
- 通知のプッシュ配信
- オンラインステータス表示