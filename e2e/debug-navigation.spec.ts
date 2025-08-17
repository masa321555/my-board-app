import { test, expect } from '@playwright/test';

test.describe('ナビゲーションデバッグテスト', () => {
  test('掲示板ページからダッシュボードへのナビゲーションをデバッグ', async ({ page }) => {
    console.log('=== ナビゲーションデバッグテスト ===\n');
    
    // コンソールログを表示
    page.on('console', (msg) => {
      if (msg.text().includes('Navigation')) {
        console.log('Browser console:', msg.text());
      }
    });
    
    // 1. ログイン
    console.log('1. ログイン');
    await page.goto('/auth/signin');
    await page.fill('input[name="email"]', 'masaharu3210101@yahoo.co.jp');
    await page.fill('input[name="password"]', 'zxcvbnm321');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard', { timeout: 10000 });
    console.log('  ✓ ダッシュボードへログイン');
    
    // 2. 掲示板へ移動
    console.log('\n2. 掲示板へ移動');
    await page.goto('/board');
    await page.waitForLoadState('networkidle');
    console.log('  現在のURL:', page.url());
    
    // 3. ダッシュボードボタンの状態を確認
    console.log('\n3. ダッシュボードボタンの状態を確認');
    const dashboardButton = page.locator('button:has-text("ダッシュボード")').first();
    
    // ボタンが存在するか確認
    const buttonCount = await dashboardButton.count();
    console.log('  ダッシュボードボタンの数:', buttonCount);
    
    if (buttonCount > 0) {
      // ボタンの属性を確認
      const isVisible = await dashboardButton.isVisible();
      const isEnabled = await dashboardButton.isEnabled();
      console.log('  ボタンは表示されている:', isVisible);
      console.log('  ボタンは有効:', isEnabled);
      
      // ボタンをクリック
      console.log('\n4. ダッシュボードボタンをクリック');
      await dashboardButton.click();
      
      // しばらく待つ
      await page.waitForTimeout(2000);
      
      // URLが変わったか確認
      const newUrl = page.url();
      console.log('  クリック後のURL:', newUrl);
      
      if (newUrl.includes('/dashboard')) {
        console.log('  ✓ ダッシュボードへ遷移しました');
      } else if (newUrl.includes('/board')) {
        console.log('  ⚠️  まだ掲示板ページにいます');
        
        // ページがリロードされたか確認
        const reloaded = await page.evaluate(() => {
          return performance.navigation.type === 1;
        });
        console.log('  ページはリロードされた:', reloaded);
      }
    }
    
    // 5. メニューからも試す
    console.log('\n5. メニューからのナビゲーションを試す');
    const accountIcon = page.locator('button[aria-label="account of current user"]');
    await accountIcon.click();
    await page.waitForTimeout(500);
    
    const menuItem = page.locator('li:has-text("ダッシュボード")').first();
    if (await menuItem.count() > 0) {
      console.log('  メニューのダッシュボードをクリック');
      await menuItem.click();
      await page.waitForTimeout(2000);
      console.log('  クリック後のURL:', page.url());
    }
  });
});