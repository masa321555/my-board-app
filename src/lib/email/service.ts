import { render } from '@react-email/render';
import nodemailer from 'nodemailer';
import { getEmailClient, EmailConfigurationError } from './client';
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
    // 環境変数でプレーンテキストモードを有効化
    const usePlainText = process.env.EMAIL_USE_PLAIN_TEXT === 'true';
    
    if (usePlainText) {
      // プレーンテキストメールの生成
      switch (template) {
        case 'verification':
          return `
メールアドレスの確認をお願いします

${data.name}様

会員制掲示板へのご登録ありがとうございます。
以下のリンクをクリックして、メールアドレスの確認を完了してください。

${data.verificationUrl}

このリンクは24時間有効です。

よろしくお願いいたします。
会員制掲示板
          `.trim();
        case 'welcome':
          return `
ようこそ！

${data.name}様

会員制掲示板へのご登録が完了しました。
今後ともよろしくお願いいたします。

会員制掲示板
          `.trim();
        case 'password-reset':
          return `
パスワードリセット

${data.name}様

パスワードリセットのリクエストを受け付けました。
以下のリンクをクリックして、新しいパスワードを設定してください。

${data.resetUrl}

このリンクは1時間有効です。

心当たりがない場合は、このメールを無視してください。

会員制掲示板
          `.trim();
        default:
          throw new Error(`Unknown email template: ${template}`);
      }
    }
    
    // HTMLメールの生成（既存のコード）
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
    // リトライ設定
    const maxRetries = 3;
    const retryDelay = 1000; // 1秒
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
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

        // コンテンツを生成
        const content = await this.renderTemplate(options.template, options.data);
        const isPlainText = process.env.EMAIL_USE_PLAIN_TEXT === 'true';

        // メールクライアントを取得
        const transporter = await getEmailClient();

        // メール送信
        const fromAddress = process.env.EMAIL_FROM || process.env.MAIL_FROM_ADDRESS || '"会員制掲示板" <noreply@myboard321.site>';
        
        console.log(`[Email Attempt ${attempt}/${maxRetries}] Sending email with config:`, {
          from: fromAddress,
          to: options.to,
          subject: options.subject,
          templateUsed: options.template,
          isPlainText,
          attempt,
        });
        
        // メールオプションを構築
        const mailOptions: any = {
          from: fromAddress,
          to: options.to,
          subject: options.subject,
          attachments: options.attachments,
        };
        
        // プレーンテキストまたはHTMLを設定
        if (isPlainText) {
          mailOptions.text = content;
        } else {
          mailOptions.html = content;
        }
        
        const result = await transporter.sendMail(mailOptions);

        console.log('Email sent successfully:', {
          messageId: result.messageId,
          accepted: result.accepted,
          rejected: result.rejected,
          response: result.response,
          attempts: attempt,
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
        // エラーの詳細をログに記録
        const errorDetails = {
          attempt,
          maxRetries,
          errorType: error?.constructor?.name,
          errorCode: (error as any)?.code,
          errorMessage: error instanceof Error ? error.message : String(error),
          smtpResponse: (error as any)?.response,
          smtpCommand: (error as any)?.command,
        };
        
        console.error(`[Email Attempt ${attempt}/${maxRetries}] Email send error:`, errorDetails);
        
        // 設定エラーの場合は即座に失敗
        if (error instanceof EmailConfigurationError) {
          return {
            success: false,
            error: error.message,
            code: 'EMAIL_CONFIG_ERROR',
          };
        }
        
        // 最後の試行の場合、またはリトライ不可能なエラーの場合
        if (attempt === maxRetries || this.isNonRetryableError(error)) {
          // エラーコードを判定
          let errorCode = 'EMAIL_SEND_FAILED';
          if ((error as any)?.code === 'ENOTFOUND') {
            errorCode = 'EMAIL_HOST_NOT_FOUND';
          } else if ((error as any)?.code === 'EAUTH') {
            errorCode = 'EMAIL_AUTH_FAILED';
          } else if ((error as any)?.code === 'EENVELOPE') {
            errorCode = 'EMAIL_INVALID_RECIPIENT';
          } else if ((error as any)?.response?.includes('550')) {
            errorCode = 'EMAIL_RECIPIENT_REJECTED';
          }
          
          return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to send email',
            code: errorCode,
          };
        }
        
        // リトライ前に待機
        console.log(`Retrying in ${retryDelay}ms...`);
        await new Promise(resolve => setTimeout(resolve, retryDelay * attempt));
      }
    }
    
    // ここには到達しないはずだが、念のため
    return {
      success: false,
      error: 'Maximum retry attempts exceeded',
    };
  }

  // リトライ不可能なエラーかどうかを判定
  private isNonRetryableError(error: unknown): boolean {
    // 設定エラーはリトライ不可能
    if (error instanceof EmailConfigurationError) {
      return true;
    }
    
    if (error instanceof Error) {
      const message = error.message.toLowerCase();
      // 認証エラー、無効なアドレスなどはリトライしない
      return message.includes('auth') || 
             message.includes('invalid') || 
             message.includes('credentials') ||
             message.includes('authentication') ||
             message.includes('configuration');
    }
    
    // SMTPエラーコードをチェック
    const errorCode = (error as any)?.code;
    if (errorCode) {
      // 認証エラー、ホストが見つからない、メールアドレスエラーなど
      return ['EAUTH', 'ENOTFOUND', 'EENVELOPE', 'ECONNREFUSED'].includes(errorCode);
    }
    
    return false;
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