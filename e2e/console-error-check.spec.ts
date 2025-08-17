import { test, expect } from '@playwright/test';

test.describe('コンソールエラー検出', () => {
  test('各ページのコンソールエラーを検出', async ({ page }) => {
    const errors: { page: string; error: string }[] = [];

    // コンソールエラーをキャプチャ
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push({
          page: page.url(),
          error: msg.text()
        });
      }
    });

    // ページエラーをキャプチャ
    page.on('pageerror', (error) => {
      errors.push({
        page: page.url(),
        error: error.message
      });
    });

    // 1. ホームページ
    console.log('=== ホームページをチェック中 ===');
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);

    // 2. サインインページ
    console.log('=== サインインページをチェック中 ===');
    await page.goto('/auth/signin', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);
    
    // フォームが存在するか確認
    const emailInput = page.locator('input[name="email"]');
    if (await emailInput.isVisible()) {
      console.log('✓ メールフィールドが見つかりました');
    }

    // 3. 登録ページ
    console.log('=== 登録ページをチェック中 ===');
    await page.goto('/auth/register', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);

    // 4. エラー表示テスト（サインインエラー）
    console.log('=== エラー表示をテスト中 ===');
    await page.goto('/auth/signin', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);
    
    // フォームに入力
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'wrongpassword');
    
    // 送信
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);

    // Alert閉じるボタンのテスト
    const closeButtons = page.locator('[aria-label="Close"]');
    const count = await closeButtons.count();
    if (count > 0) {
      console.log(`✓ ${count}個の閉じるボタンが見つかりました`);
      await closeButtons.first().click();
      await page.waitForTimeout(1000);
    }

    // 結果を表示
    console.log('\n=== エラーサマリー ===');
    if (errors.length === 0) {
      console.log('✅ コンソールエラーは検出されませんでした');
    } else {
      console.log(`❌ ${errors.length}個のエラーが検出されました:`);
      errors.forEach((e, i) => {
        console.log(`\n${i + 1}. ページ: ${e.page}`);
        console.log(`   エラー: ${e.error}`);
      });
    }

    // エラーがないことを期待
    expect(errors).toHaveLength(0);
  });
});