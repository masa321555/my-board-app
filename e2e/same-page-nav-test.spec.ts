import { test, expect } from '@playwright/test';

test.describe('同じページへのナビゲーションテスト', () => {
  test('同じページへのリンクをクリックした場合の動作を確認', async ({ page }) => {
    console.log('=== 同じページへのナビゲーションテスト ===\n');
    
    let reloadOccurred = false;
    
    // ページリロードを監視
    page.on('load', () => {
      reloadOccurred = true;
      console.log('ページがリロードされました');
    });
    
    // 1. ログインして掲示板ページへ
    console.log('1. ログイン');
    await page.goto('/auth/signin');
    await page.fill('input[name="email"]', 'masaharu3210101@yahoo.co.jp');
    await page.fill('input[name="password"]', 'zxcvbnm321');
    await page.click('button[type="submit"]');
    await page.waitForURL('/board', { timeout: 10000 });
    console.log('  ✓ 掲示板ページへ到達');
    
    // 2. 掲示板ページでダッシュボードボタンをクリック
    console.log('\n2. 掲示板ページでダッシュボードボタンをクリック');
    reloadOccurred = false;
    
    const dashboardButton = page.locator('button:has-text("ダッシュボード")').first();
    if (await dashboardButton.count() > 0) {
      await dashboardButton.click();
      await page.waitForTimeout(1500);
      
      if (reloadOccurred) {
        console.log('  ✓ ページがリロードされました（正常）');
      } else {
        console.log('  ❌ ページがリロードされませんでした');
      }
    }
    
    // 3. 掲示板ボタンをクリック
    console.log('\n3. 掲示板ボタンをクリック');
    reloadOccurred = false;
    
    const boardButton = page.locator('button:has-text("掲示板")').last();
    if (await boardButton.count() > 0) {
      await boardButton.click();
      await page.waitForTimeout(1500);
      
      if (reloadOccurred) {
        console.log('  ✓ ページがリロードされました（正常）');
      } else {
        console.log('  ❌ ページがリロードされませんでした');
      }
    }
    
    // 現在のURLを確認
    console.log('\n現在のURL:', page.url());
    expect(page.url()).toContain('/board');
  });
});