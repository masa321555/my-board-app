import nodemailer from 'nodemailer';
import { Transporter } from 'nodemailer';
import SMTPTransport from 'nodemailer/lib/smtp-transport';

let transporter: Transporter | null = null;

// ダミートランスポーターの作成
function createDummyTransporter(context: string): Transporter {
  const dummyTransporter = Object.create(nodemailer.createTransport.prototype);
  
  dummyTransporter.sendMail = async (mailOptions: SMTPTransport.MailOptions): Promise<SMTPTransport.SentMessageInfo> => {
    console.log(`[${context}] Email would be sent:`, {
      to: mailOptions.to,
      subject: mailOptions.subject
    });
    
    // Convert all addresses to strings
    const toAddresses = Array.isArray(mailOptions.to) 
      ? mailOptions.to.map(addr => addr?.toString() || '')
      : [mailOptions.to?.toString() || ''];
    
    return {
      messageId: `dummy-${context}-${Date.now()}@local`,
      envelope: {
        from: mailOptions.from?.toString() || 'noreply@local',
        to: toAddresses
      },
      accepted: toAddresses,
      rejected: [],
      pending: [],
      response: '250 OK: Dummy message sent'
    };
  };
  
  dummyTransporter.verify = async (): Promise<true> => {
    console.log(`[${context}] Dummy transporter verified`);
    return true;
  };
  
  dummyTransporter.close = async (): Promise<void> => {
    console.log(`[${context}] Dummy transporter closed`);
  };
  
  // その他の必要なメソッドのスタブ
  dummyTransporter.isIdle = () => true;
  dummyTransporter.set = () => dummyTransporter;
  dummyTransporter.get = () => undefined;
  
  return dummyTransporter as Transporter;
}

export function getEmailClient(): Transporter {
  if (transporter) {
    return transporter;
  }

  // メール設定がされていない場合の処理
  const emailProvider = process.env.EMAIL_PROVIDER || 'smtp';
  
  // メール設定が存在しない場合、ダミートランスポーターを返す
  if (!process.env.EMAIL_PROVIDER && !process.env.MAIL_HOST && !process.env.GMAIL_USER && !process.env.YAHOO_USER) {
    console.warn('No email configuration found. Email sending will be disabled.');
    transporter = createDummyTransporter('no-config');
    return transporter;
  }
  
  switch (emailProvider.toLowerCase()) {
    case 'gmail':
      const gmailUser = process.env.GMAIL_USER;
      const gmailPassword = process.env.GMAIL_APP_PASSWORD;

      if (!gmailUser || !gmailPassword) {
        console.error('Gmail credentials not configured. Please set GMAIL_USER and GMAIL_APP_PASSWORD environment variables.');
        transporter = createDummyTransporter('gmail-not-configured');
        return transporter;
      }

      transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: gmailUser,
          pass: gmailPassword,
        },
        pool: true,
        maxConnections: 5,
        maxMessages: 100,
        rateDelta: 1000,
        rateLimit: 5,
      });
      break;

    case 'yahoo':
      const yahooUser = process.env.YAHOO_USER;
      const yahooPassword = process.env.YAHOO_APP_PASSWORD;

      if (!yahooUser || !yahooPassword) {
        console.error('Yahoo credentials not configured. Please set YAHOO_USER and YAHOO_APP_PASSWORD environment variables.');
        transporter = createDummyTransporter('yahoo-not-configured');
        return transporter;
      }

      transporter = nodemailer.createTransport({
        service: 'yahoo',
        auth: {
          user: yahooUser,
          pass: yahooPassword,
        },
        pool: true,
        maxConnections: 5,
        maxMessages: 100,
        rateDelta: 1000,
        rateLimit: 5,
      });
      break;

    case 'smtp':
    default:
      // 汎用SMTP設定（既存のmuumuu-mail設定と互換性あり）
      const smtpHost = process.env.MAIL_HOST;
      const smtpPort = parseInt(process.env.MAIL_PORT || '587');
      const smtpUser = process.env.MAIL_USER;
      const smtpPass = process.env.MAIL_PASS;
      const smtpSecure = process.env.MAIL_SECURE === 'true';

      if (!smtpHost || !smtpUser || !smtpPass) {
        console.error('SMTP credentials not configured. Please set MAIL_HOST, MAIL_USER, and MAIL_PASS environment variables.');
        transporter = createDummyTransporter('smtp-not-configured');
        return transporter;
      }

      transporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpSecure,
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
        tls: {
          rejectUnauthorized: process.env.NODE_ENV === 'production',
        },
        pool: true,
        maxConnections: 5,
        maxMessages: 100,
        rateDelta: 1000,
        rateLimit: 5,
      });
      break;
  }

  // 接続テスト（非同期でバックグラウンドで実行）
  if (transporter) {
    transporter.verify((error) => {
      if (error) {
        console.error('Email client verification failed:', error);
        console.error('Provider:', emailProvider);
        // エラーの場合でもtransporterはnullにしない（接続は後で復活する可能性がある）
      } else {
        console.log(`Email client is ready to send messages via ${emailProvider}`);
      }
    });
  }

  // この時点でtransporterがnullの場合は、フォールバックのダミートランスポーターを作成
  if (!transporter) {
    transporter = createDummyTransporter('fallback');
  }

  return transporter;
}

// 接続をクローズする関数（アプリケーション終了時に使用）
export async function closeEmailClient(): Promise<void> {
  if (transporter) {
    await transporter.close();
    transporter = null;
  }
}