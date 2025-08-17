import { test, expect } from '@playwright/test';

test.describe('手動ダッシュボード確認', () => {
  test('ダッシュボードリンクをブラウザで確認', async ({ page }) => {
    console.log('=== ダッシュボードリンクの手動確認 ===\n');
    
    // 1. ログイン
    console.log('1. ログイン');
    await page.goto('/auth/signin');
    await page.fill('input[name="email"]', 'masaharu3210101@yahoo.co.jp');
    await page.fill('input[name="password"]', 'zxcvbnm321');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard', { timeout: 10000 });
    console.log('  ✓ ログイン成功');
    
    // 2. 掲示板へ移動
    console.log('\n2. 掲示板へ移動');
    await page.goto('/board');
    await page.waitForLoadState('networkidle');
    
    // 3. ヘッダーの状態を確認
    console.log('\n3. ヘッダーの状態を確認');
    
    // ダッシュボードボタンの検査
    const dashboardButtons = await page.locator('button:has-text("ダッシュボード")').all();
    console.log(`  ダッシュボードボタンの数: ${dashboardButtons.length}`);
    
    if (dashboardButtons.length > 0) {
      for (let i = 0; i < dashboardButtons.length; i++) {
        const button = dashboardButtons[i];
        const isVisible = await button.isVisible();
        const isEnabled = await button.isEnabled();
        const buttonText = await button.textContent();
        console.log(`  ボタン${i+1}: "${buttonText}" - 表示: ${isVisible}, 有効: ${isEnabled}`);
        
        // ボタンの親要素を確認
        const parent = await button.locator('..').elementHandle();
        if (parent) {
          const tagName = await parent.evaluate(el => el.tagName);
          const className = await parent.evaluate(el => el.className);
          console.log(`    親要素: <${tagName} class="${className}">`);
        }
      }
    }
    
    // 4. 10秒待機して手動確認
    console.log('\n4. ブラウザで手動確認してください（10秒待機）');
    await page.waitForTimeout(10000);
    
    // 5. ダッシュボードボタンをクリック
    console.log('\n5. プログラムでダッシュボードボタンをクリック');
    const firstButton = page.locator('button:has-text("ダッシュボード")').first();
    await firstButton.click();
    
    // 6. 結果を確認
    await page.waitForTimeout(3000);
    const currentUrl = page.url();
    console.log(`  現在のURL: ${currentUrl}`);
    
    if (currentUrl.includes('/dashboard')) {
      console.log('  ✓ ダッシュボードへ遷移しました');
    } else {
      console.log('  ❌ ダッシュボードへ遷移できませんでした');
      
      // ページのHTMLを一部取得
      const headerHtml = await page.locator('header').innerHTML();
      console.log('\n  ヘッダーのHTML:');
      console.log(headerHtml.substring(0, 500) + '...');
    }
    
    // さらに10秒待機
    console.log('\n7. 再度ブラウザで確認してください（10秒待機）');
    await page.waitForTimeout(10000);
  });
});