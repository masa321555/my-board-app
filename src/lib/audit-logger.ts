import { NextRequest } from 'next/server';
import winston from 'winston';
import dbConnect from '@/lib/mongodb';
import AuditLog, { AuditAction, IAuditLog } from '@/models/AuditLog';

// Winstonロガーの設定
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'board-app' },
  transports: [
    // ファイルへの出力（エラーレベル）
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    // ファイルへの出力（全レベル）
    new winston.transports.File({
      filename: 'logs/combined.log',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
  ],
});

// 開発環境ではコンソールにも出力
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    ),
  }));
}

// IPアドレスを取得
export function getClientIp(req: NextRequest): string {
  const forwarded = req.headers.get('x-forwarded-for');
  const real = req.headers.get('x-real-ip');
  const ip = forwarded ? forwarded.split(',')[0].trim() : real || 'unknown';
  return ip;
}

// User-Agentを取得
export function getUserAgent(req: NextRequest): string {
  return req.headers.get('user-agent') || 'unknown';
}

// 監査ログのエントリを作成
export interface AuditLogEntry {
  userId?: string;
  action: AuditAction;
  resource?: string;
  resourceId?: string;
  success?: boolean;
  errorMessage?: string;
  metadata?: Record<string, any>;
  req: NextRequest;
}

// 監査ログを記録
export async function recordAuditLog(entry: AuditLogEntry): Promise<void> {
  try {
    await dbConnect();
    
    const logData: Partial<IAuditLog> = {
      userId: entry.userId,
      action: entry.action,
      resource: entry.resource,
      resourceId: entry.resourceId,
      ipAddress: getClientIp(entry.req),
      userAgent: getUserAgent(entry.req),
      success: entry.success ?? true,
      errorMessage: entry.errorMessage,
      metadata: entry.metadata || {},
      timestamp: new Date(),
    };
    
    // データベースに保存
    await AuditLog.create(logData);
    
    // Winstonでもログを記録
    const level = entry.success === false ? 'warn' : 'info';
    logger.log(level, `Audit: ${entry.action}`, logData);
  } catch (error) {
    // 監査ログの記録失敗はアプリケーションの動作に影響させない
    logger.error('Failed to record audit log', { error, entry });
  }
}

// 簡易ログ記録関数
export async function logLogin(userId: string, success: boolean, req: NextRequest, errorMessage?: string): Promise<void> {
  await recordAuditLog({
    userId,
    action: success ? AuditAction.LOGIN : AuditAction.LOGIN_FAILED,
    success,
    errorMessage,
    req,
  });
}

export async function logPostCreate(userId: string, postId: string, req: NextRequest): Promise<void> {
  await recordAuditLog({
    userId,
    action: AuditAction.POST_CREATE,
    resource: 'post',
    resourceId: postId,
    req,
  });
}

export async function logPostUpdate(userId: string, postId: string, req: NextRequest): Promise<void> {
  await recordAuditLog({
    userId,
    action: AuditAction.POST_UPDATE,
    resource: 'post',
    resourceId: postId,
    req,
  });
}

export async function logPostDelete(userId: string, postId: string, req: NextRequest): Promise<void> {
  await recordAuditLog({
    userId,
    action: AuditAction.POST_DELETE,
    resource: 'post',
    resourceId: postId,
    req,
  });
}

export async function logRateLimitExceeded(userId: string | undefined, endpoint: string, req: NextRequest): Promise<void> {
  await recordAuditLog({
    userId,
    action: AuditAction.RATE_LIMIT_EXCEEDED,
    resource: 'api',
    resourceId: endpoint,
    success: false,
    req,
  });
}

export async function logUnauthorizedAccess(userId: string | undefined, resource: string, req: NextRequest): Promise<void> {
  await recordAuditLog({
    userId,
    action: AuditAction.UNAUTHORIZED_ACCESS,
    resource,
    success: false,
    req,
  });
}

export async function logPasswordChange(userId: string, req: NextRequest): Promise<void> {
  await recordAuditLog({
    userId,
    action: AuditAction.PASSWORD_CHANGE,
    req,
  });
}

// 監査ログの検索
export interface AuditLogQuery {
  userId?: string;
  action?: AuditAction | AuditAction[];
  resource?: string;
  resourceId?: string;
  ipAddress?: string;
  success?: boolean;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}

export async function searchAuditLogs(query: AuditLogQuery): Promise<IAuditLog[]> {
  await dbConnect();
  
  const filter: any = {};
  
  if (query.userId) filter.userId = query.userId;
  if (query.action) {
    filter.action = Array.isArray(query.action) ? { $in: query.action } : query.action;
  }
  if (query.resource) filter.resource = query.resource;
  if (query.resourceId) filter.resourceId = query.resourceId;
  if (query.ipAddress) filter.ipAddress = query.ipAddress;
  if (query.success !== undefined) filter.success = query.success;
  
  if (query.startDate || query.endDate) {
    filter.timestamp = {};
    if (query.startDate) filter.timestamp.$gte = query.startDate;
    if (query.endDate) filter.timestamp.$lte = query.endDate;
  }
  
  const dbQuery = AuditLog.find(filter)
    .sort({ timestamp: -1 })
    .limit(query.limit || 100)
    .skip(query.offset || 0);
  
  return await dbQuery.exec();
}

// 統計情報の取得
export async function getAuditStats(userId?: string, days: number = 30): Promise<any> {
  await dbConnect();
  
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  const match: any = { timestamp: { $gte: startDate } };
  if (userId) match.userId = userId;
  
  const stats = await AuditLog.aggregate([
    { $match: match },
    {
      $group: {
        _id: '$action',
        count: { $sum: 1 },
        lastOccurrence: { $max: '$timestamp' },
      },
    },
    { $sort: { count: -1 } },
  ]);
  
  return stats;
}

export default logger;