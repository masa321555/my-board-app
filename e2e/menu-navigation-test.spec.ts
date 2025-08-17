import { test, expect } from '@playwright/test';

test.describe('メニューナビゲーションテスト', () => {
  test('メニューからダッシュボードへ遷移できるか確認', async ({ page }) => {
    console.log('=== メニューナビゲーションテスト ===\n');
    
    // 1. ログイン
    await page.goto('/auth/signin');
    await page.fill('input[name="email"]', 'masaharu3210101@yahoo.co.jp');
    await page.fill('input[name="password"]', 'zxcvbnm321');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard', { timeout: 10000 });
    console.log('✓ ログイン成功');
    
    // 2. 掲示板へ移動
    await page.goto('/board');
    await page.waitForLoadState('networkidle');
    console.log('✓ 掲示板ページへ移動');
    
    // 3. アカウントメニューを開く
    console.log('\n3. アカウントメニューを開く');
    const accountIcon = page.locator('button[aria-label="account of current user"]');
    await accountIcon.click();
    await page.waitForTimeout(500); // メニューが開くのを待つ
    console.log('✓ メニューが開きました');
    
    // 4. メニュー項目を確認
    const menuItems = await page.locator('li[role="menuitem"]').all();
    console.log(`\nメニュー項目数: ${menuItems.length}`);
    
    for (let i = 0; i < menuItems.length; i++) {
      const text = await menuItems[i].textContent();
      console.log(`  ${i + 1}. ${text}`);
    }
    
    // 5. ダッシュボードメニューをクリック
    console.log('\n5. ダッシュボードメニューをクリック');
    const dashboardMenuItem = page.locator('li:has-text("ダッシュボード")').first();
    await dashboardMenuItem.click();
    
    // 6. ナビゲーションを待つ
    await page.waitForTimeout(3000);
    
    const currentUrl = page.url();
    console.log(`\n現在のURL: ${currentUrl}`);
    
    if (currentUrl.includes('/dashboard')) {
      console.log('✓ ダッシュボードへ正常に遷移しました');
    } else {
      console.log('❌ ダッシュボードへ遷移できませんでした');
    }
    
    // 7. 再度掲示板へ移動してプロフィールも確認
    console.log('\n7. 再度掲示板へ移動してプロフィールメニューも確認');
    await page.goto('/board');
    await page.waitForLoadState('networkidle');
    
    await accountIcon.click();
    await page.waitForTimeout(500);
    
    const profileMenuItem = page.locator('li:has-text("プロフィール")').first();
    await profileMenuItem.click();
    
    await page.waitForTimeout(3000);
    const profileUrl = page.url();
    console.log(`\nプロフィールクリック後のURL: ${profileUrl}`);
    
    if (profileUrl.includes('/profile')) {
      console.log('✓ プロフィールへも正常に遷移しました');
    } else {
      console.log('❌ プロフィールへ遷移できませんでした');
    }
  });
});