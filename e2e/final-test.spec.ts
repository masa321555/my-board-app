import { test, expect } from '@playwright/test';

test.describe('最終動作確認', () => {
  test('removeChildエラーの最終確認', async ({ page }) => {
    let removeChildError = false;
    const allErrors: string[] = [];
    
    // すべてのエラーを記録
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        const text = msg.text();
        allErrors.push(text);
        
        if (text.includes('removeChild') || text.includes('NotFoundError') || text.includes('Failed to execute')) {
          removeChildError = true;
          console.log('\n❌ DOMエラー検出:');
          console.log(text);
          console.log('---\n');
        }
      }
    });

    page.on('pageerror', (error) => {
      const message = error.message;
      const stack = error.stack || '';
      allErrors.push(message);
      
      if (message.includes('removeChild') || message.includes('NotFoundError')) {
        removeChildError = true;
        console.log('\n❌ ページエラー検出:');
        console.log(message);
        if (stack) {
          console.log('スタックトレース:');
          console.log(stack.split('\n').slice(0, 5).join('\n'));
        }
        console.log('---\n');
      }
    });

    console.log('=== 最終動作確認テスト ===\n');

    // 1. サインインページ
    console.log('1. サインインページのテスト');
    await page.goto('/auth/signin');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // エラーを発生させる
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'wrong');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(2000);

    // エラーアラートの操作
    const alert = page.locator('.MuiAlert-root').first();
    if (await alert.count() > 0) {
      console.log('  ✓ エラーアラートが表示されました');
      
      const closeBtn = alert.locator('button[aria-label="Close"]').first();
      if (await closeBtn.count() > 0) {
        await closeBtn.click();
        console.log('  ✓ 閉じるボタンをクリックしました');
        await page.waitForTimeout(1000);
      }
    }

    // 2. 登録ページ
    console.log('\n2. 登録ページのテスト');
    await page.goto('/auth/register');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // バリデーションエラーを発生させる
    await page.fill('input[name="email"]', 'invalid');
    await page.fill('input[name="password"]', '123');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(1000);

    // 3. パスワードリセットページ
    console.log('\n3. パスワードリセットページのテスト');
    await page.goto('/auth/forgot-password');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // 空のメールで送信
    await page.click('button[type="submit"]');
    await page.waitForTimeout(1000);

    // 結果
    console.log('\n=== 最終結果 ===');
    if (removeChildError) {
      console.log('❌ removeChildエラーが検出されました');
      console.log(`\n全エラー数: ${allErrors.length}`);
      console.log('\nエラー一覧:');
      allErrors.forEach((err, i) => {
        console.log(`${i + 1}. ${err.substring(0, 100)}...`);
      });
    } else {
      console.log('✅ removeChildエラーは検出されませんでした');
      console.log(`\nその他のエラー数: ${allErrors.filter(e => !e.includes('401') && !e.includes('Failed to load resource')).length}`);
    }

    expect(removeChildError).toBe(false);
  });
});