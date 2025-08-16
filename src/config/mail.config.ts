// メール設定
export const mailConfig = {
  // SMTP設定
  smtp: {
    host: process.env.MAIL_HOST || 'smtp.muumuu-mail.com',
    port: parseInt(process.env.MAIL_PORT || '587'),
    secure: process.env.MAIL_SECURE === 'true',
    auth: {
      user: process.env.MAIL_USER!,
      pass: process.env.MAIL_PASS!,
    },
    // ムームーメール用の追加設定
    tls: {
      rejectUnauthorized: false, // 開発環境用
    },
  },
  
  // 送信者情報
  from: {
    address: process.env.MAIL_FROM_ADDRESS || 'noreply@yourdomain.com',
    name: process.env.MAIL_FROM_NAME || '会員制掲示板',
  },
  
  // 管理者メール
  admin: {
    address: process.env.MAIL_ADMIN_ADDRESS || 'admin@yourdomain.com',
  },
  
  // 送信制限（ムームーメールの制限に合わせる）
  rateLimit: {
    maxPerHour: 100,
    maxPerDay: 1000,
  },
  
  // リトライ設定
  retry: {
    attempts: 3,
    delay: 5000, // 5秒
  },
};

// 環境別の設定
export const getMailConfig = () => {
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  if (isDevelopment) {
    console.log('開発環境: メール送信をコンソールに出力します');
    return {
      ...mailConfig,
      // 開発環境では実際には送信しない設定も可能
      preview: true,
    };
  }
  
  return mailConfig;
};