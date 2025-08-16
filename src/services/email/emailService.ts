import nodemailer from 'nodemailer';
import fs from 'fs/promises';
import path from 'path';

interface EmailOptions {
  to: string;
  subject: string;
  template: string;
  data: Record<string, any>;
}

class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.MAIL_HOST,
      port: parseInt(process.env.MAIL_PORT || '587'),
      secure: process.env.MAIL_SECURE === 'true',
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS,
      },
    });
  }

  private async loadTemplate(templateName: string, data: Record<string, any>): Promise<string> {
    const templatePath = path.join(
      process.cwd(),
      'src',
      'templates',
      'email',
      `${templateName}.html`
    );
    
    let html = await fs.readFile(templatePath, 'utf-8');
    
    // テンプレート変数を置換
    Object.keys(data).forEach(key => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      html = html.replace(regex, data[key]);
    });
    
    return html;
  }

  async sendEmail(options: EmailOptions): Promise<void> {
    const { to, subject, template, data } = options;
    
    // 共通のデータを追加
    const emailData = {
      ...data,
      appName: process.env.APP_NAME || '会員制掲示板',
      year: new Date().getFullYear(),
      supportEmail: process.env.MAIL_SUPPORT_ADDRESS,
    };
    
    const html = await this.loadTemplate(template, emailData);
    
    const mailOptions = {
      from: `${process.env.MAIL_FROM_NAME} <${process.env.MAIL_FROM_ADDRESS}>`,
      to,
      subject,
      html,
    };
    
    await this.transporter.sendMail(mailOptions);
  }

  // 会員登録確認メール
  async sendRegistrationConfirmation(email: string, userName: string, confirmationToken: string): Promise<void> {
    const confirmationUrl = `${process.env.APP_URL}/auth/confirm-email?token=${confirmationToken}`;
    
    await this.sendEmail({
      to: email,
      subject: '【会員制掲示板】メールアドレスの確認',
      template: 'registration-confirmation',
      data: {
        userName,
        confirmationUrl,
      },
    });
  }

  // パスワードリセットメール
  async sendPasswordReset(email: string, userName: string, resetToken: string): Promise<void> {
    const resetUrl = `${process.env.APP_URL}/auth/reset-password?token=${resetToken}`;
    
    await this.sendEmail({
      to: email,
      subject: '【会員制掲示板】パスワードリセットのご案内',
      template: 'password-reset',
      data: {
        userName,
        resetUrl,
      },
    });
  }

  // システム通知メール（例：新規投稿通知）
  async sendSystemNotification(email: string, userName: string, subject: string, message: string): Promise<void> {
    await this.sendEmail({
      to: email,
      subject: `【会員制掲示板】${subject}`,
      template: 'system-notification',
      data: {
        userName,
        message,
        dashboardUrl: `${process.env.APP_URL}/dashboard`,
      },
    });
  }

  // メール送信テスト
  async testConnection(): Promise<boolean> {
    try {
      await this.transporter.verify();
      console.log('メールサーバーへの接続に成功しました');
      return true;
    } catch (error) {
      console.error('メールサーバーへの接続に失敗しました:', error);
      return false;
    }
  }
}

export default new EmailService();