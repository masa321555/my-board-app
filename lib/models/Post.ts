import mongoose, { Document, Schema } from 'mongoose';

export interface IPost extends Document {
  title: string;
  content: string;
  author: mongoose.Types.ObjectId;
  authorName: string;
  views?: number;
  createdAt: Date;
  updatedAt: Date;
}

const PostSchema: Schema = new Schema({
  title: {
    type: String,
    required: [true, 'タイトルは必須です'],
    maxlength: [100, 'タイトルは100文字以内で入力してください'],
    trim: true,
  },
  content: {
    type: String,
    required: [true, '投稿内容は必須です'],
    maxlength: [1000, '投稿は1000文字以内で入力してください'],
    trim: true,
  },
  author: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  authorName: {
    type: String,
    required: true,
  },
  views: {
    type: Number,
    default: 0,
  },
}, {
  timestamps: true,
});

export default mongoose.models.Post || mongoose.model<IPost>('Post', PostSchema);