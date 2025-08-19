import { NextRequest } from 'next/server';
import { successResponse, errorResponse } from '@/utils/apiResponse';
import { getEmailClient } from '@/lib/email/client';

// Node.js Runtimeを使用（メール機能のため）
export const runtime = 'nodejs';

export async function GET(_request: NextRequest) {
  try {
    const healthStatus: Record<string, any> = {
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
    };

    // 環境変数のチェック
    const emailConfig = {
      provider: process.env.EMAIL_PROVIDER || 'not_set',
      hasFrom: !!process.env.EMAIL_FROM || !!process.env.MAIL_FROM_ADDRESS,
      hasSmtpConfig: !!(process.env.MAIL_HOST && process.env.MAIL_USER && process.env.MAIL_PASS),
      hasSendgridKey: !!process.env.SENDGRID_API_KEY,
      hasGmailConfig: !!(process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD),
      hasYahooConfig: !!(process.env.YAHOO_USER && process.env.YAHOO_APP_PASSWORD),
      usePlainText: process.env.EMAIL_USE_PLAIN_TEXT === 'true',
    };

    healthStatus.configuration = emailConfig;

    // 設定されているプロバイダーに基づいてチェック
    let isConfigured = false;
    let configurationDetails = '';

    switch (emailConfig.provider.toLowerCase()) {
      case 'smtp':
        isConfigured = emailConfig.hasSmtpConfig;
        configurationDetails = isConfigured 
          ? 'SMTP configuration found' 
          : 'Missing SMTP configuration (MAIL_HOST, MAIL_USER, MAIL_PASS)';
        break;
      
      case 'sendgrid':
        isConfigured = emailConfig.hasSendgridKey;
        configurationDetails = isConfigured 
          ? 'SendGrid API key found' 
          : 'Missing SENDGRID_API_KEY';
        break;
      
      case 'gmail':
        isConfigured = emailConfig.hasGmailConfig;
        configurationDetails = isConfigured 
          ? 'Gmail configuration found' 
          : 'Missing Gmail configuration (GMAIL_USER, GMAIL_APP_PASSWORD)';
        break;
      
      case 'yahoo':
        isConfigured = emailConfig.hasYahooConfig;
        configurationDetails = isConfigured 
          ? 'Yahoo configuration found' 
          : 'Missing Yahoo configuration (YAHOO_USER, YAHOO_APP_PASSWORD)';
        break;
      
      case 'ethereal':
        isConfigured = true;
        configurationDetails = 'Ethereal Email (test mode)';
        break;
      
      default:
        // プロバイダーが設定されていない場合、利用可能な設定をチェック
        if (emailConfig.hasSmtpConfig) {
          isConfigured = true;
          configurationDetails = 'SMTP configuration available (provider not explicitly set)';
        } else if (emailConfig.hasSendgridKey) {
          isConfigured = true;
          configurationDetails = 'SendGrid configuration available (provider not explicitly set)';
        } else {
          isConfigured = false;
          configurationDetails = 'No email configuration found';
        }
    }

    healthStatus.isConfigured = isConfigured;
    healthStatus.details = configurationDetails;

    // トランスポーターの接続テスト（設定されている場合のみ）
    if (isConfigured) {
      try {
        const transporter = await getEmailClient();
        
        // verify()メソッドでSMTP接続をテスト
        await new Promise<void>((resolve, reject) => {
          transporter.verify((error) => {
            if (error) {
              reject(error);
            } else {
              resolve();
            }
          });
        });
        
        healthStatus.connectionTest = {
          success: true,
          message: 'Email transporter verified successfully',
        };
      } catch (error) {
        healthStatus.connectionTest = {
          success: false,
          error: error instanceof Error ? error.message : 'Connection test failed',
          errorType: error?.constructor?.name,
        };
      }
    } else {
      healthStatus.connectionTest = {
        success: false,
        error: 'Skipped - Email not configured',
      };
    }

    // 全体のヘルス状態を判定
    const isHealthy = isConfigured && (!healthStatus.connectionTest || healthStatus.connectionTest.success);
    
    return successResponse(
      {
        isHealthy,
        ...healthStatus,
      },
      isHealthy ? 'Email service is operational' : 'Email service has issues',
      isHealthy ? 200 : 503
    );
  } catch (error) {
    console.error('Email health check error:', error);
    return errorResponse(
      'Email health check failed',
      'HEALTH_CHECK_ERROR',
      500,
      { error: error instanceof Error ? error.message : 'Unknown error' }
    );
  }
}