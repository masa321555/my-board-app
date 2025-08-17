import { test, expect } from '@playwright/test';

test.describe('window.location.hrefによるナビゲーションテスト', () => {
  test('window.location.hrefでダッシュボードに遷移できるか確認', async ({ page }) => {
    console.log('=== window.location.href ナビゲーションテスト ===\n');
    
    // コンソールログを監視
    page.on('console', (msg) => {
      console.log(`[Console]: ${msg.text()}`);
    });
    
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
    console.log('  現在のURL:', page.url());
    
    // 3. ダッシュボードボタンをクリック
    console.log('\n3. ダッシュボードボタンをクリック');
    const dashboardButton = page.locator('button:has-text("ダッシュボード")').first();
    await dashboardButton.click();
    
    // 4. ナビゲーションを待つ
    console.log('\n4. ナビゲーションを待機');
    await page.waitForTimeout(3000);
    
    const currentUrl = page.url();
    console.log('  現在のURL:', currentUrl);
    
    if (currentUrl.includes('/dashboard')) {
      console.log('  ✓ ダッシュボードへ遷移しました');
    } else {
      console.log('  ❌ ダッシュボードへ遷移できませんでした');
    }
  });
});