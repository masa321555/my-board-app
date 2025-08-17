import { test, expect } from '@playwright/test';

test.describe('ダッシュボード直接アクセステスト', () => {
  test('URLで直接ダッシュボードにアクセス', async ({ page }) => {
    console.log('=== ダッシュボード直接アクセステスト ===\n');
    
    // 1. ログイン
    console.log('1. ログイン');
    await page.goto('/auth/signin');
    await page.fill('input[name="email"]', 'masaharu3210101@yahoo.co.jp');
    await page.fill('input[name="password"]', 'zxcvbnm321');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard', { timeout: 10000 });
    console.log('  ✓ ログイン成功');
    
    // 2. 一旦掲示板へ移動
    console.log('\n2. 掲示板へ移動');
    await page.goto('/board');
    await page.waitForLoadState('networkidle');
    console.log('  現在のURL:', page.url());
    
    // 3. URLで直接ダッシュボードにアクセス
    console.log('\n3. URLで直接ダッシュボードにアクセス');
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    console.log('  現在のURL:', page.url());
    
    // ダッシュボードページの要素を確認
    const pageTitle = await page.locator('h1:has-text("ダッシュボード")').count();
    if (pageTitle > 0) {
      console.log('  ✓ ダッシュボードページが表示されています');
    } else {
      console.log('  ❌ ダッシュボードページが表示されていません');
    }
    
    // 4. ヘッダーのダッシュボードボタンを再度確認
    console.log('\n4. ヘッダーの状態を確認');
    const headerButtons = await page.locator('header button').all();
    console.log(`  ヘッダーのボタン数: ${headerButtons.length}`);
    
    for (let i = 0; i < headerButtons.length; i++) {
      const button = headerButtons[i];
      const text = await button.textContent();
      console.log(`  ボタン${i+1}: "${text}"`);
    }
    
    // 5. 掲示板へ戻る
    console.log('\n5. 掲示板ボタンをクリック');
    await page.locator('button:has-text("掲示板")').first().click();
    await page.waitForTimeout(2000);
    console.log('  現在のURL:', page.url());
    
    // 6. 再度ダッシュボードボタンをクリック
    console.log('\n6. ダッシュボードボタンをクリック');
    await page.locator('button:has-text("ダッシュボード")').first().click();
    await page.waitForTimeout(2000);
    console.log('  現在のURL:', page.url());
    
    // 10秒待機
    console.log('\n7. ブラウザで確認してください（10秒待機）');
    await page.waitForTimeout(10000);
  });
});