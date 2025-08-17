import { test, expect } from '@playwright/test';

test.describe('総合動作確認', () => {
  test('各ページの動作とエラーチェック', async ({ page }) => {
    let totalErrors = 0;
    const pageErrors: { [key: string]: string[] } = {};
    
    // エラーをキャプチャ（401エラーは除外）
    page.on('console', (msg) => {
      if (msg.type() === 'error' && !msg.text().includes('401') && !msg.text().includes('Failed to load resource')) {
        const url = page.url();
        if (!pageErrors[url]) pageErrors[url] = [];
        pageErrors[url].push(msg.text());
        totalErrors++;
      }
    });
    
    page.on('pageerror', (error) => {
      const url = page.url();
      if (!pageErrors[url]) pageErrors[url] = [];
      pageErrors[url].push(error.message);
      totalErrors++;
    });

    console.log('=== 総合動作確認テスト開始 ===\n');

    // 1. ホームページ
    console.log('1. ホームページをチェック中...');
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    console.log('✓ ホームページが正常に表示されました');

    // 2. サインインページ
    console.log('\n2. サインインページをチェック中...');
    await page.goto('/auth/signin');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('h1:has-text("ログイン")')).toBeVisible();
    console.log('✓ サインインページが正常に表示されました');

    // 3. 登録ページ
    console.log('\n3. 登録ページをチェック中...');
    await page.goto('/auth/register');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('h1:has-text("新規登録")')).toBeVisible();
    console.log('✓ 登録ページが正常に表示されました');

    // 4. パスワードリセットページ
    console.log('\n4. パスワードリセットページをチェック中...');
    await page.goto('/auth/forgot-password');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('h1:has-text("パスワードをリセット")')).toBeVisible();
    console.log('✓ パスワードリセットページが正常に表示されました');

    // 5. 認証が必要なページ（リダイレクトテスト）
    console.log('\n5. 認証が必要なページをチェック中...');
    await page.goto('/board');
    await page.waitForURL('**/auth/signin');
    console.log('✓ 未認証時に正しくサインインページにリダイレクトされました');

    // 6. ダッシュボード
    console.log('\n6. ダッシュボードページをチェック中...');
    await page.goto('/dashboard');
    await page.waitForURL('**/auth/signin');
    console.log('✓ 未認証時に正しくサインインページにリダイレクトされました');

    // エラーサマリー
    console.log('\n=== エラーサマリー ===');
    if (totalErrors === 0) {
      console.log('✅ すべてのページでエラーは検出されませんでした');
    } else {
      console.log(`❌ ${totalErrors}個のエラーが検出されました:`);
      Object.entries(pageErrors).forEach(([url, errors]) => {
        console.log(`\n${url}:`);
        errors.forEach((error, index) => {
          console.log(`  ${index + 1}. ${error}`);
        });
      });
    }

    expect(totalErrors).toBe(0);
  });

  test('フォーム操作の詳細テスト', async ({ page }) => {
    const errors: string[] = [];
    
    page.on('console', (msg) => {
      if (msg.type() === 'error' && !msg.text().includes('401') && !msg.text().includes('Failed to load resource')) {
        errors.push(msg.text());
      }
    });

    console.log('=== フォーム操作の詳細テスト ===\n');

    // サインインフォーム
    await page.goto('/auth/signin');
    await page.waitForLoadState('networkidle');

    // バリデーションテスト
    console.log('1. バリデーションテスト');
    await page.fill('input[name="email"]', '');
    await page.fill('input[name="password"]', '');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(500);
    
    // HTML5バリデーションメッセージの確認
    const emailInput = page.locator('input[name="email"]');
    const emailValidation = await emailInput.evaluate((el: HTMLInputElement) => el.validationMessage);
    console.log(`  メールフィールドのバリデーション: ${emailValidation || 'OK'}`);

    // エラー表示と閉じるボタンのテスト
    console.log('\n2. エラー表示と閉じるボタンのテスト');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'wrongpass');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(2000);

    const alert = page.locator('.MuiAlert-root');
    if (await alert.isVisible()) {
      console.log('  ✓ エラーアラートが表示されました');
      
      const closeBtn = alert.locator('button[aria-label="Close"]');
      if (await closeBtn.isVisible()) {
        await closeBtn.click();
        await page.waitForTimeout(500);
        if (!(await alert.isVisible())) {
          console.log('  ✓ アラートが正常に閉じられました');
        }
      }
    }

    // パスワード表示トグルの連続操作
    console.log('\n3. パスワード表示トグルの連続操作テスト');
    const passwordInput = page.locator('input[name="password"]');
    const toggleBtn = page.locator('[aria-label*="password"]');
    
    for (let i = 0; i < 5; i++) {
      await toggleBtn.click();
      await page.waitForTimeout(100);
      const type = await passwordInput.getAttribute('type');
      console.log(`  ${i + 1}回目: type="${type}"`);
    }

    console.log(`\n総エラー数: ${errors.length}`);
    expect(errors).toHaveLength(0);
  });
});