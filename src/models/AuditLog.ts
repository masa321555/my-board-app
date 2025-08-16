import mongoose, { Document, Model, Schema } from 'mongoose';

// 監査ログのアクションタイプ
export enum AuditAction {
  // 認証関連
  LOGIN = 'LOGIN',
  LOGOUT = 'LOGOUT',
  LOGIN_FAILED = 'LOGIN_FAILED',
  PASSWORD_CHANGE = 'PASSWORD_CHANGE',
  PASSWORD_RESET = 'PASSWORD_RESET',
  
  // ユーザー管理
  USER_CREATE = 'USER_CREATE',
  USER_UPDATE = 'USER_UPDATE',
  USER_DELETE = 'USER_DELETE',
  
  // 投稿管理
  POST_CREATE = 'POST_CREATE',
  POST_UPDATE = 'POST_UPDATE',
  POST_DELETE = 'POST_DELETE',
  POST_VIEW = 'POST_VIEW',
  
  // セキュリティ
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  UNAUTHORIZED_ACCESS = 'UNAUTHORIZED_ACCESS',
  CSRF_VIOLATION = 'CSRF_VIOLATION',
  
  // システム
  SYSTEM_ERROR = 'SYSTEM_ERROR',
  CONFIG_CHANGE = 'CONFIG_CHANGE',
}

// 監査ログのインターフェース
export interface IAuditLog extends Document {
  userId?: string;
  action: AuditAction;
  resource?: string;
  resourceId?: string;
  ipAddress: string;
  userAgent: string;
  success: boolean;
  errorMessage?: string;
  metadata?: Record<string, any>;
  timestamp: Date;
}

// 監査ログのスキーマ
const AuditLogSchema = new Schema<IAuditLog>({
  userId: {
    type: String,
    index: true,
  },
  action: {
    type: String,
    enum: Object.values(AuditAction),
    required: true,
    index: true,
  },
  resource: {
    type: String,
    index: true,
  },
  resourceId: {
    type: String,
    index: true,
  },
  ipAddress: {
    type: String,
    required: true,
    index: true,
  },
  userAgent: {
    type: String,
    required: true,
  },
  success: {
    type: Boolean,
    required: true,
    default: true,
  },
  errorMessage: String,
  metadata: {
    type: Schema.Types.Mixed,
    default: {},
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true,
  },
}, {
  collection: 'audit_logs',
});

// 複合インデックス
AuditLogSchema.index({ userId: 1, timestamp: -1 });
AuditLogSchema.index({ action: 1, timestamp: -1 });
AuditLogSchema.index({ resource: 1, resourceId: 1, timestamp: -1 });

// TTLインデックス（90日後に自動削除）
AuditLogSchema.index({ timestamp: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });

const AuditLog: Model<IAuditLog> = mongoose.models.AuditLog || mongoose.model<IAuditLog>('AuditLog', AuditLogSchema);

export default AuditLog;