// 環境変数の設定状況を確認
require('dotenv').config();

console.log('=== 環境変数チェック ===\n');

const requiredVars = [
  'MONGODB_URI',
  'MAIL_HOST',
  'MAIL_PORT',
  'MAIL_USER',
  'MAIL_PASS',
  'MAIL_FROM_ADDRESS',
  'JWT_SECRET',
  'SESSION_SECRET'
];

let allSet = true;

requiredVars.forEach(varName => {
  const value = process.env[varName];
  if (value) {
    console.log(`✅ ${varName}: 設定済み`);
  } else {
    console.log(`❌ ${varName}: 未設定`);
    allSet = false;
  }
});

console.log('\n' + (allSet ? '✅ すべての必須項目が設定されています！' : '❌ 未設定の項目があります。'));