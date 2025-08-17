import nodemailer from 'nodemailer';
import { Transporter } from 'nodemailer';

let transporter: Transporter | null = null;

export function getEmailClient(): Transporter {
  if (transporter) {
    return transporter;
  }

  // メールプロバイダーの判定
  const emailProvider = process.env.EMAIL_PROVIDER || 'smtp'; // gmail, yahoo, smtp
  
  switch (emailProvider.toLowerCase()) {
    case 'gmail':
      const gmailUser = process.env.GMAIL_USER;
      const gmailPassword = process.env.GMAIL_APP_PASSWORD;

      if (!gmailUser || !gmailPassword) {
        throw new Error('Gmail credentials not configured. Please set GMAIL_USER and GMAIL_APP_PASSWORD environment variables.');
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
        throw new Error('Yahoo credentials not configured. Please set YAHOO_USER and YAHOO_APP_PASSWORD environment variables.');
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
        throw new Error('SMTP credentials not configured. Please set MAIL_HOST, MAIL_USER, and MAIL_PASS environment variables.');
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

  // 接続テスト
  transporter.verify((error) => {
    if (error) {
      console.error('Email client verification failed:', error);
      console.error('Provider:', emailProvider);
      transporter = null;
    } else {
      console.log(`Email client is ready to send messages via ${emailProvider}`);
    }
  });

  return transporter;
}

// 接続をクローズする関数（アプリケーション終了時に使用）
export async function closeEmailClient(): Promise<void> {
  if (transporter) {
    await transporter.close();
    transporter = null;
  }
}