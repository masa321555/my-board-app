// SendGrid実装例（DKIM自動対応）
import sgMail from '@sendgrid/mail';
import { EmailOptions } from './emailService';

export class SendGridEmailService {
  constructor() {
    sgMail.setApiKey(process.env.SENDGRID_API_KEY!);
  }

  async sendEmail(options: EmailOptions): Promise<void> {
    const msg = {
      to: options.to,
      from: {
        email: process.env.MAIL_FROM_ADDRESS!,
        name: process.env.MAIL_FROM_NAME!
      },
      subject: options.subject,
      html: await this.loadTemplate(options.template, options.data),
      // SendGridが自動的にDKIM署名を追加
    };

    await sgMail.send(msg);
  }

  private async loadTemplate(templateName: string, data: Record<string, any>): Promise<string> {
    // 既存のテンプレートロジックを再利用
    return '';
  }
}

// 環境変数例
// SENDGRID_API_KEY=SG.xxxxxxxxxxxxxxxxxxxxx
// SendGridは自動的にDKIM, SPF, DMARCを処理