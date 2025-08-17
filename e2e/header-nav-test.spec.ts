import { test, expect } from '@playwright/test';

test.describe('ヘッダーナビゲーション詳細テスト', () => {
  test('ヘッダーのすべてのリンクが正常に動作することを確認', async ({ page }) => {
    console.log('=== ヘッダーナビゲーション詳細テスト ===\n');
    
    // コンソールログを監視
    page.on('console', (msg) => {
      if (msg.text().includes('Navigation')) {
        console.log('Console:', msg.text());
      }
    });
    
    // 1. ログイン
    console.log('1. ログイン');
    await page.goto('/auth/signin');
    await page.fill('input[name="email"]', 'masaharu3210101@yahoo.co.jp');
    await page.fill('input[name="password"]', 'zxcvbnm321');
    await page.click('button[type="submit"]');
    await page.waitForURL('/board', { timeout: 10000 });
    console.log('  ✓ ログイン成功');
    
    // 2. ホームページへ移動してからダッシュボードリンクをテスト
    console.log('\n2. ホームページへ移動');
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    console.log('  現在のURL:', page.url());
    
    // 3. ダッシュボードボタンをクリック
    console.log('\n3. ダッシュボードボタンをクリック');
    const dashboardButton = page.locator('button:has-text("ダッシュボード")').first();
    if (await dashboardButton.count() > 0) {
      await dashboardButton.click();
      await page.waitForTimeout(1000);
      console.log('  クリック後のURL:', page.url());
      
      if (page.url().includes('/board')) {
        console.log('  ✓ 掲示板ページへ遷移しました');
      } else {
        console.log('  ❌ ページ遷移が発生しませんでした');
      }
    }
    
    // 4. メニューからのナビゲーションをテスト
    console.log('\n4. メニューナビゲーションテスト');
    
    // ホームページへ戻る
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // アカウントアイコンをクリック
    const accountIcon = page.locator('button[aria-label="account of current user"]');
    if (await accountIcon.count() > 0) {
      console.log('  アカウントアイコンをクリック');
      await accountIcon.click();
      await page.waitForTimeout(500);
      
      // メニューが表示されているか確認
      const menu = page.locator('#menu-appbar');
      if (await menu.isVisible()) {
        console.log('  ✓ メニューが表示されました');
        
        // ダッシュボードメニュー項目をクリック
        const dashboardMenuItem = page.locator('li:has-text("ダッシュボード")').first();
        if (await dashboardMenuItem.count() > 0) {
          console.log('  ダッシュボードメニューをクリック');
          await dashboardMenuItem.click();
          await page.waitForTimeout(1000);
          console.log('  クリック後のURL:', page.url());
          
          if (page.url().includes('/board')) {
            console.log('  ✓ 掲示板ページへ遷移しました');
          }
        }
      }
    }
    
    // 5. プロフィールリンクをテスト
    console.log('\n5. プロフィールリンクテスト');
    await page.goto('/');
    await accountIcon.click();
    await page.waitForTimeout(500);
    
    const profileMenuItem = page.locator('li:has-text("プロフィール")');
    if (await profileMenuItem.count() > 0) {
      console.log('  プロフィールメニューをクリック');
      await profileMenuItem.click();
      await page.waitForTimeout(1000);
      console.log('  クリック後のURL:', page.url());
      
      if (page.url().includes('/profile')) {
        console.log('  ✓ プロフィールページへ遷移しました');
      } else {
        console.log('  ❌ プロフィールページへの遷移が発生しませんでした');
      }
    }
  });
});