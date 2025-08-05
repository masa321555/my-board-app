import mongoose, { Document, Schema } from 'mongoose';

export interface IPost extends Document {
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

const PostSchema: Schema = new Schema({
  content: {
    type: String,
    required: [true, '投稿内容は必須です'],
    maxlength: [200, '投稿は200文字以内で入力してください'],
    trim: true,
  },
}, {
  timestamps: true,
});

export default mongoose.models.Post || mongoose.model<IPost>('Post', PostSchema);