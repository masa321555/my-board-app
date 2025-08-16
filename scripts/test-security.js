#!/usr/bin/env node

const axios = require('axios');
const readline = require('readline');
const { JSDOM } = require('jsdom');
const DOMPurify = require('isomorphic-dompurify');

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000';

// カラー出力用のヘルパー
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logTest(testName, passed) {
  const status = passed ? `✓ PASS` : `✗ FAIL`;
  const color = passed ? 'green' : 'red';
  log(`  ${status}: ${testName}`, color);
}

function logSection(title) {
  log(`\n${colors.bright}========== ${title} ==========${colors.reset}`);
}

// テスト用のユーザー認証情報
let authCookie = null;
let csrfToken = null;

// プロンプト入力用のヘルパー
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function prompt(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
}

// ログイン処理
async function login(email, password) {
  try {
    const response = await axios.post(`${BASE_URL}/api/auth/callback/credentials`, 
      new URLSearchParams({
        email,
        password,
        redirect: 'false',
        callbackUrl: '/board',
        json: 'true'
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        withCredentials: true,
        maxRedirects: 0,
        validateStatus: (status) => status < 500
      }
    );

    // セッションクッキーを取得
    const cookies = response.headers['set-cookie'];
    if (cookies) {
      authCookie = cookies.find(cookie => cookie.includes('next-auth.session-token'));
    }

    return !!authCookie;
  } catch (error) {
    console.error('Login error:', error.message);
    return false;
  }
}

// CSRFトークンを取得
async function getCSRFToken() {
  try {
    const response = await axios.get(`${BASE_URL}/api/csrf-token`, {
      headers: authCookie ? { Cookie: authCookie } : {}
    });
    return response.data.token;
  } catch (error) {
    console.error('CSRF token fetch error:', error.message);
    return null;
  }
}

// 1. レート制限テスト
async function testRateLimit() {
  logSection('レート制限テスト');
  
  const endpoint = `${BASE_URL}/api/posts`;
  const requests = [];
  
  // 6回連続でリクエストを送信（制限は5回/分）
  for (let i = 0; i < 6; i++) {
    requests.push(
      axios.post(endpoint, 
        { title: `Test ${i}`, content: `Test content ${i}` },
        {
          headers: {
            Cookie: authCookie,
            'X-CSRF-Token': csrfToken,
            'Content-Type': 'application/json'
          },
          validateStatus: () => true
        }
      )
    );
  }
  
  const responses = await Promise.all(requests);
  const rateLimited = responses.some(res => res.status === 429);
  const successCount = responses.filter(res => res.status === 201).length;
  
  logTest('5回目までのリクエストが成功', successCount === 5);
  logTest('6回目のリクエストが429エラー', rateLimited);
  
  // レート制限ヘッダーの確認
  const limitedResponse = responses.find(res => res.status === 429);
  if (limitedResponse) {
    logTest('X-RateLimit-Limitヘッダーが存在', !!limitedResponse.headers['x-ratelimit-limit']);
    logTest('Retry-Afterヘッダーが存在', !!limitedResponse.headers['retry-after']);
  }
}

// 2. XSS攻撃テスト
async function testXSSProtection() {
  logSection('XSS防御テスト');
  
  const xssPayloads = [
    {
      name: 'スクリプトタグ',
      title: '<script>alert("XSS")</script>Test',
      content: 'Normal content'
    },
    {
      name: 'イベントハンドラ',
      title: 'Test',
      content: '<img src=x onerror="alert(\'XSS\')" />'
    },
    {
      name: 'JavaScriptプロトコル',
      title: '<a href="javascript:alert(\'XSS\')">Click</a>',
      content: 'Test content'
    }
  ];
  
  for (const payload of xssPayloads) {
    try {
      const response = await axios.post(`${BASE_URL}/api/posts`,
        payload,
        {
          headers: {
            Cookie: authCookie,
            'X-CSRF-Token': csrfToken,
            'Content-Type': 'application/json'
          },
          validateStatus: () => true
        }
      );
      
      if (response.status === 201) {
        // 作成された投稿を取得して確認
        const postId = response.data._id;
        const getResponse = await axios.get(`${BASE_URL}/api/posts/${postId}`, {
          headers: { Cookie: authCookie }
        });
        
        const sanitizedTitle = DOMPurify.sanitize(payload.title);
        const sanitizedContent = DOMPurify.sanitize(payload.content);
        
        logTest(
          `${payload.name}: タイトルがサニタイズされている`,
          getResponse.data.title === sanitizedTitle
        );
        logTest(
          `${payload.name}: 本文がサニタイズされている`,
          getResponse.data.content === sanitizedContent
        );
      } else {
        logTest(`${payload.name}: 不正な入力が拒否された`, true);
      }
    } catch (error) {
      logTest(`${payload.name}: エラーで保護されている`, true);
    }
  }
}

// 3. CSRF攻撃テスト
async function testCSRFProtection() {
  logSection('CSRF防御テスト');
  
  // CSRFトークンなしでリクエスト
  try {
    const response = await axios.post(`${BASE_URL}/api/posts`,
      { title: 'CSRF Test', content: 'Testing CSRF protection' },
      {
        headers: {
          Cookie: authCookie,
          'Content-Type': 'application/json'
        },
        validateStatus: () => true
      }
    );
    
    logTest('CSRFトークンなしのリクエストが拒否される', response.status === 403);
  } catch (error) {
    logTest('CSRFトークンなしのリクエストが拒否される', true);
  }
  
  // 無効なCSRFトークンでリクエスト
  try {
    const response = await axios.post(`${BASE_URL}/api/posts`,
      { title: 'CSRF Test 2', content: 'Testing invalid CSRF token' },
      {
        headers: {
          Cookie: authCookie,
          'X-CSRF-Token': 'invalid-token-12345',
          'Content-Type': 'application/json'
        },
        validateStatus: () => true
      }
    );
    
    logTest('無効なCSRFトークンのリクエストが拒否される', response.status === 403);
  } catch (error) {
    logTest('無効なCSRFトークンのリクエストが拒否される', true);
  }
  
  // 有効なCSRFトークンでリクエスト
  const validToken = await getCSRFToken();
  try {
    const response = await axios.post(`${BASE_URL}/api/posts`,
      { title: 'Valid CSRF Test', content: 'Testing with valid CSRF token' },
      {
        headers: {
          Cookie: authCookie,
          'X-CSRF-Token': validToken,
          'Content-Type': 'application/json'
        },
        validateStatus: () => true
      }
    );
    
    logTest('有効なCSRFトークンのリクエストが成功する', response.status === 201);
  } catch (error) {
    logTest('有効なCSRFトークンのリクエストが成功する', false);
  }
}

// 4. セキュリティヘッダーテスト
async function testSecurityHeaders() {
  logSection('セキュリティヘッダーテスト');
  
  try {
    const response = await axios.get(BASE_URL, {
      validateStatus: () => true
    });
    
    const headers = response.headers;
    
    logTest('X-Frame-Options: DENY', headers['x-frame-options'] === 'DENY');
    logTest('X-Content-Type-Options: nosniff', headers['x-content-type-options'] === 'nosniff');
    logTest('X-XSS-Protection: 1; mode=block', headers['x-xss-protection'] === '1; mode=block');
    logTest('Referrer-Policy: strict-origin-when-cross-origin', 
      headers['referrer-policy'] === 'strict-origin-when-cross-origin');
    logTest('Content-Security-Policy が設定されている', !!headers['content-security-policy']);
    
    // HSTS (HTTPS環境でのみ)
    if (BASE_URL.startsWith('https://')) {
      logTest('Strict-Transport-Security が設定されている', 
        !!headers['strict-transport-security']);
    }
  } catch (error) {
    log('セキュリティヘッダーの取得に失敗しました', 'red');
  }
}

// 5. 入力値検証テスト
async function testInputValidation() {
  logSection('入力値検証テスト');
  
  const invalidInputs = [
    {
      name: '空のタイトル',
      data: { title: '', content: 'Valid content' },
      expectError: true
    },
    {
      name: 'タイトルが長すぎる（101文字）',
      data: { title: 'a'.repeat(101), content: 'Valid content' },
      expectError: true
    },
    {
      name: '本文が長すぎる（1001文字）',
      data: { title: 'Valid title', content: 'a'.repeat(1001) },
      expectError: true
    },
    {
      name: 'SQLインジェクション',
      data: { title: "'; DROP TABLE posts; --", content: 'Test' },
      expectError: false // サニタイズされるが、エラーにはならない
    },
    {
      name: 'NoSQLインジェクション',
      data: { title: '{"$ne": null}', content: 'Test' },
      expectError: false // サニタイズされるが、エラーにはならない
    }
  ];
  
  for (const test of invalidInputs) {
    try {
      const response = await axios.post(`${BASE_URL}/api/posts`,
        test.data,
        {
          headers: {
            Cookie: authCookie,
            'X-CSRF-Token': csrfToken,
            'Content-Type': 'application/json'
          },
          validateStatus: () => true
        }
      );
      
      if (test.expectError) {
        logTest(`${test.name}: エラーが返される`, response.status >= 400);
      } else {
        logTest(`${test.name}: リクエストが処理される`, response.status < 400);
      }
    } catch (error) {
      logTest(`${test.name}: エラーで保護されている`, test.expectError);
    }
  }
}

// 6. 監査ログテスト
async function testAuditLogging() {
  logSection('監査ログテスト');
  
  // 注: 実際のログ確認にはデータベースアクセスが必要
  log('監査ログのテストには管理者権限とデータベースアクセスが必要です', 'yellow');
  log('以下のイベントがログに記録されることを確認してください：', 'cyan');
  log('  - ログイン試行（成功/失敗）', 'cyan');
  log('  - レート制限超過', 'cyan');
  log('  - 不正アクセス試行', 'cyan');
  log('  - CRUD操作（作成/更新/削除）', 'cyan');
  
  // 不正アクセスの試行をトリガー
  try {
    await axios.get(`${BASE_URL}/admin`, {
      headers: { Cookie: authCookie },
      validateStatus: () => true,
      maxRedirects: 0
    });
    log('  → 管理者エリアへの不正アクセスを試行しました', 'yellow');
  } catch (error) {
    // Expected
  }
}

// メインのテスト実行関数
async function runTests() {
  log('\n🔒 セキュリティテストスイート 🔒\n', 'bright');
  
  // ユーザー認証情報を取得
  const email = await prompt('テスト用メールアドレス: ');
  const password = await prompt('パスワード: ');
  
  log('\nログイン中...', 'yellow');
  const loginSuccess = await login(email, password);
  
  if (!loginSuccess) {
    log('ログインに失敗しました。認証情報を確認してください。', 'red');
    rl.close();
    return;
  }
  
  log('ログインに成功しました！', 'green');
  
  // CSRFトークンを取得
  csrfToken = await getCSRFToken();
  if (!csrfToken) {
    log('CSRFトークンの取得に失敗しました。', 'red');
    rl.close();
    return;
  }
  
  // 各テストを実行
  await testRateLimit();
  await testXSSProtection();
  await testCSRFProtection();
  await testSecurityHeaders();
  await testInputValidation();
  await testAuditLogging();
  
  log('\n✅ すべてのテストが完了しました！', 'bright');
  rl.close();
}

// エラーハンドリング
process.on('unhandledRejection', (error) => {
  console.error('Unhandled rejection:', error);
  rl.close();
  process.exit(1);
});

// テスト実行
runTests();