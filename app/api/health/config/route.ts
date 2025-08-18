import { NextRequest } from 'next/server';
import { successResponse, errorResponse } from '@/utils/apiResponse';

// Edge Runtimeを使用（高速レスポンス）
export const runtime = 'edge';

export async function GET(_request: NextRequest) {
  try {
    // 環境変数のグループごとにチェック
    const groups: Record<string, { required: string[]; vars: string[] }> = {
      database: {
        required: ['MONGODB_URI'],
        vars: ['MONGODB_URI', 'MONGODB_DB']
      },
      authentication: {
        required: [], // JWT_SECRETまたはNEXTAUTH_SECRETのいずれかが必要（特別処理）
        vars: ['JWT_SECRET', 'NEXTAUTH_SECRET', 'NEXTAUTH_URL']
      },
      email: {
        required: [],
        vars: ['EMAIL_FROM', 'EMAIL_PROVIDER', 'SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASS', 'SENDGRID_API_KEY']
      },
      app: {
        required: [],
        vars: ['APP_URL', 'VERCEL_URL', 'NODE_ENV']
      }
    };

    const status: Record<string, any> = {};
    let hasErrors = false;

    // 各グループの環境変数をチェック
    for (const [groupName, groupConfig] of Object.entries(groups)) {
      const groupStatus: Record<string, any> = {
        configured: {} as Record<string, boolean>,
        missing: [] as string[],
        required: groupConfig.required,
        isHealthy: true
      };

      // 各変数の存在をチェック
      for (const varName of groupConfig.vars) {
        const isConfigured = !!process.env[varName];
        groupStatus.configured[varName] = isConfigured;
        
        if (!isConfigured && groupConfig.required.includes(varName)) {
          groupStatus.missing.push(varName);
          groupStatus.isHealthy = false;
          hasErrors = true;
        }
      }

      // 認証グループの特別処理（JWT_SECRETまたはNEXTAUTH_SECRETのいずれかが必要）
      if (groupName === 'authentication') {
        const hasJwtSecret = !!process.env.JWT_SECRET || !!process.env.NEXTAUTH_SECRET;
        if (!hasJwtSecret) {
          groupStatus.missing.push('JWT_SECRET or NEXTAUTH_SECRET');
          groupStatus.isHealthy = false;
          hasErrors = true;
        }
      }

      status[groupName] = groupStatus;
    }

    // 全体の健全性
    const overallHealth = {
      isHealthy: !hasErrors,
      environment: process.env.NODE_ENV,
      timestamp: new Date().toISOString(),
      groups: status
    };

    // 開発環境では詳細なステータスを返す
    if (process.env.NODE_ENV === 'development') {
      return successResponse(
        overallHealth,
        hasErrors ? 'Configuration incomplete' : 'All systems operational',
        hasErrors ? 503 : 200
      );
    }

    // 本番環境では最小限の情報のみ
    return successResponse(
      {
        isHealthy: overallHealth.isHealthy,
        timestamp: overallHealth.timestamp
      },
      overallHealth.isHealthy ? 'OK' : 'Configuration Error',
      overallHealth.isHealthy ? 200 : 503
    );
  } catch (error) {
    console.error('Health check error:', error);
    return errorResponse(
      'Health check failed',
      'HEALTH_CHECK_ERROR',
      500
    );
  }
}