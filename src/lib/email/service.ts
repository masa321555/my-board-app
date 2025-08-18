import { render } from '@react-email/render';
import nodemailer from 'nodemailer';
import { getEmailClient } from './client';
import { EmailOptions, EmailResponse, EmailTemplate } from '@/types/email';
import WelcomeEmail from '@/emails/templates/WelcomeEmail';
import VerificationEmail from '@/emails/templates/VerificationEmail';
import PasswordResetEmail from '@/emails/templates/PasswordResetEmail';

// レート制限のストレージ（本番環境ではRedisを使用）
const rateLimitStore = new Map<string, { count: number; resetAt: Date }>();

export class EmailService {
  private static instance: EmailService;

  private constructor() {}

  static getInstance(): EmailService {
    if (!EmailService.instance) {
      EmailService.instance = new EmailService();
    }
    return EmailService.instance;
  }

  // レート制限チェック
  private async checkRateLimit(key: string): Promise<boolean> {
    const now = new Date();
    const limit = parseInt(process.env.EMAIL_RATE_LIMIT_PER_HOUR || '100');
    
    const record = rateLimitStore.get(key);
    
    if (!record || record.resetAt < now) {
      rateLimitStore.set(key, {
        count: 1,
        resetAt: new Date(now.getTime() + 60 * 60 * 1000), // 1時間後
      });
      return true;
    }
    
    if (record.count >= limit) {
      return false;
    }
    
    record.count++;
    return true;
  }

  // テンプレートをHTMLに変換
  private async renderTemplate(template: EmailTemplate, data: any): Promise<string> {
    switch (template) {
      case 'welcome':
        return render(WelcomeEmail(data));
      case 'verification':
        return render(VerificationEmail(data));
      case 'password-reset':
        return render(PasswordResetEmail(data));
      default:
        throw new Error(`Unknown email template: ${template}`);
    }
  }

  // メール送信
  async send(options: EmailOptions): Promise<EmailResponse> {
    try {
      // レート制限チェック
      const rateLimitKey = Array.isArray(options.to) ? options.to[0] : options.to;
      const canSend = await this.checkRateLimit(rateLimitKey);
      
      if (!canSend) {
        return {
          success: false,
          error: 'Rate limit exceeded. Please try again later.',
        };
      }

      // HTMLコンテンツを生成
      const html = await this.renderTemplate(options.template, options.data);

      // メールクライアントを取得
      const transporter = await getEmailClient();

      // メール送信
      const fromAddress = process.env.EMAIL_FROM || process.env.MAIL_FROM_ADDRESS || '"会員制掲示板" <noreply@myboard321.site>';
      
      console.log('Sending email with config:', {
        from: fromAddress,
        to: options.to,
        subject: options.subject,
        templateUsed: options.template
      });
      
      const result = await transporter.sendMail({
        from: fromAddress,
        to: options.to,
        subject: options.subject,
        html,
        attachments: options.attachments,
      });

      console.log('Email sent successfully:', {
        messageId: result.messageId,
        accepted: result.accepted,
        rejected: result.rejected,
        response: result.response
      });
      
      // Ethereal Email の場合、プレビューURLを表示
      if (process.env.EMAIL_PROVIDER === 'ethereal') {
        const previewUrl = nodemailer.getTestMessageUrl(result);
        if (previewUrl) {
          console.log('Preview URL:', previewUrl);
        }
      }
      
      return {
        success: true,
        messageId: result.messageId,
      };
    } catch (error) {
      console.error('Email send error:', error);
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to send email',
      };
    }
  }

  // ウェルカムメール送信
  async sendWelcomeEmail(to: string, data: { name: string; email: string }): Promise<EmailResponse> {
    return this.send({
      to,
      subject: '会員制掲示板へようこそ！',
      template: 'welcome',
      data,
    });
  }

  // 確認メール送信
  async sendVerificationEmail(
    to: string,
    data: { name: string; verificationUrl: string }
  ): Promise<EmailResponse> {
    return this.send({
      to,
      subject: 'メールアドレスの確認をお願いします',
      template: 'verification',
      data,
    });
  }

  // パスワードリセットメール送信
  async sendPasswordResetEmail(
    to: string,
    data: { name: string; resetUrl: string; ipAddress?: string; userAgent?: string }
  ): Promise<EmailResponse> {
    return this.send({
      to,
      subject: 'パスワードリセットのご案内',
      template: 'password-reset',
      data,
    });
  }
}

// シングルトンインスタンスをエクスポート
export const emailService = EmailService.getInstance();