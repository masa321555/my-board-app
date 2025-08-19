import nodemailer from 'nodemailer';
import { Transporter } from 'nodemailer';
import SMTPTransport from 'nodemailer/lib/smtp-transport';

let transporter: Transporter | null = null;

// メール設定エラーのクラス
export class EmailConfigurationError extends Error {
  constructor(message: string, public context: string) {
    super(message);
    this.name = 'EmailConfigurationError';
  }
}

// ダミートランスポーターの作成（エラーを投げるバージョン）
function createDummyTransporter(context: string): Transporter {
  const dummyTransporter = Object.create(nodemailer.createTransport.prototype);
  
  dummyTransporter.sendMail = async (mailOptions: SMTPTransport.MailOptions): Promise<SMTPTransport.SentMessageInfo> => {
    console.error(`[${context}] Email configuration missing. Cannot send email:`, {
      to: mailOptions.to,
      subject: mailOptions.subject
    });
    
    // 環境変数が設定されていない場合はエラーを投げる
    throw new EmailConfigurationError(
      `Email sending failed: ${context}. Please configure email settings in environment variables.`,
      context
    );
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

export async function getEmailClient(): Promise<Transporter> {
  if (transporter) {
    return transporter;
  }

  // メール設定がされていない場合の処理
  // EMAIL_PROVIDERが未設定の場合、MAIL_HOSTがあればsmtpとして扱う
  let emailProvider = process.env.EMAIL_PROVIDER;
  
  // EMAIL_PROVIDERが未設定でもMAIL_HOSTがあればSMTPとして扱う
  if (!emailProvider && process.env.MAIL_HOST) {
    emailProvider = 'smtp';
    console.log('EMAIL_PROVIDER not set, but MAIL_HOST found. Using SMTP provider.');
  }
  
  // デフォルトはsmtp
  emailProvider = emailProvider || 'smtp';
  
  // メール設定が全く存在しない場合、ダミートランスポーターを返す
  if (!process.env.MAIL_HOST && !process.env.GMAIL_USER && !process.env.YAHOO_USER && !process.env.SENDGRID_API_KEY) {
    console.error('No email configuration found. Email sending will fail.');
    transporter = createDummyTransporter('no-config');
    return transporter;
  }
  
  switch (emailProvider.toLowerCase()) {
    case 'sendgrid':
      const sendgridApiKey = process.env.SENDGRID_API_KEY;
      
      if (!sendgridApiKey) {
        console.error('SendGrid API key not configured. Please set SENDGRID_API_KEY environment variable.');
        transporter = createDummyTransporter('sendgrid-not-configured');
        return transporter;
      }
      
      // SendGrid用のnodemailerトランスポーター設定
      transporter = nodemailer.createTransport({
        host: 'smtp.sendgrid.net',
        port: 587,
        secure: false,
        auth: {
          user: 'apikey', // SendGridでは常に'apikey'を使用
          pass: sendgridApiKey,
        },
      });
      
      console.log('SendGrid transporter created');
      break;
    case 'ethereal':
      // Ethereal Email for development testing
      console.log('Using Ethereal Email for testing');
      
      // Create a test account using Ethereal
      const testAccount = await nodemailer.createTestAccount();
      
      transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      });
      
      console.log('Ethereal test account created:', testAccount.user);
      console.log('View sent emails at: https://ethereal.email/messages');
      break;
      
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
        console.error('Current environment variables:', {
          MAIL_HOST: smtpHost,
          MAIL_USER: smtpUser,
          MAIL_PASS: smtpPass ? '[REDACTED]' : undefined,
          MAIL_PORT: smtpPort,
          EMAIL_PROVIDER: emailProvider
        });
        transporter = createDummyTransporter('smtp-not-configured');
        return transporter;
      }

      console.log('Creating SMTP transporter with config:', {
        host: smtpHost,
        port: smtpPort,
        secure: smtpSecure,
        user: smtpUser,
        tls_rejectUnauthorized: process.env.NODE_ENV === 'production',
        from: process.env.EMAIL_FROM || process.env.MAIL_FROM_ADDRESS
      });

      const smtpOptions: SMTPTransport.Options = {
        host: smtpHost,
        port: smtpPort,
        secure: smtpSecure,
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
        tls: {
          // 開発環境では証明書の検証をスキップ
          rejectUnauthorized: process.env.NODE_ENV === 'production',
        },
        // タイムアウト設定
        connectionTimeout: 30000, // 30秒
        greetingTimeout: 15000, // 15秒
        socketTimeout: 45000, // 45秒
      };
      
      transporter = nodemailer.createTransport(smtpOptions);
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
    try {
      // close()メソッドは同期的
      transporter.close();
    } catch (error) {
      console.error('Error closing email transporter:', error);
    }
    transporter = null;
  }
}