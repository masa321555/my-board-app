// セキュアなシークレットキーを生成するスクリプト
const crypto = require('crypto');

console.log('=== セキュアなキーを生成 ===\n');

// JWT_SECRET用
const jwtSecret = crypto.randomBytes(32).toString('hex');
console.log('JWT_SECRET:');
console.log(jwtSecret);
console.log('');

// SESSION_SECRET用
const sessionSecret = crypto.randomBytes(32).toString('hex');
console.log('SESSION_SECRET:');
console.log(sessionSecret);
console.log('');

console.log('上記の値を.envファイルにコピーしてください。');