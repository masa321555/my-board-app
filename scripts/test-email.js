// メール送信テストスクリプト
require('dotenv').config();
const nodemailer = require('nodemailer');

async function testEmail() {
  console.log('メール送信テストを開始します...\n');
  
  // 設定確認
  console.log('=== 設定内容 ===');
  console.log('SMTP Host:', process.env.MAIL_HOST);
  console.log('SMTP Port:', process.env.MAIL_PORT);
  console.log('From:', process.env.MAIL_FROM_ADDRESS);
  console.log('');
  
  try {
    // トランスポーター作成
    const transporter = nodemailer.createTransport({
      host: process.env.MAIL_HOST,
      port: parseInt(process.env.MAIL_PORT || '587'),
      secure: process.env.MAIL_SECURE === 'true',
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS,
      },
    });
    
    // 接続テスト
    console.log('SMTPサーバーへの接続をテスト中...');
    await transporter.verify();
    console.log('✅ SMTPサーバーへの接続に成功しました！\n');
    
    // テストメール送信
    console.log('テストメールを送信中...');
    const info = await transporter.sendMail({
      from: `${process.env.MAIL_FROM_NAME} <${process.env.MAIL_FROM_ADDRESS}>`,
      to: process.env.MAIL_ADMIN_ADDRESS,
      subject: 'メール送信テスト',
      text: 'これはテストメールです。正常に受信できていれば、メール設定は成功です。',
      html: `
        <h2>メール送信テスト</h2>
        <p>これはテストメールです。</p>
        <p>正常に受信できていれば、メール設定は成功です。</p>
        <hr>
        <p>送信日時: ${new Date().toLocaleString('ja-JP')}</p>
      `,
    });
    
    console.log('✅ メールが送信されました！');
    console.log('Message ID:', info.messageId);
    console.log(`\n${process.env.MAIL_ADMIN_ADDRESS} のメールボックスを確認してください。`);
    
  } catch (error) {
    console.error('❌ エラーが発生しました:', error.message);
    console.error('\n詳細:', error);
  }
}

testEmail();