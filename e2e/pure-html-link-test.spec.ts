import { test, expect } from '@playwright/test';

test.describe('純粋なHTMLリンクテスト', () => {
  test('純粋なaタグでダッシュボードに遷移できるか確認', async ({ page }) => {
    console.log('=== 純粋なHTMLリンクテスト ===\n');
    
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
    
    // 3. リンクの属性を確認
    const dashboardLink = page.locator('a[href="/dashboard"]').first();
    const linkExists = await dashboardLink.count() > 0;
    console.log(`\nダッシュボードリンクの存在: ${linkExists}`);
    
    if (linkExists) {
      const href = await dashboardLink.getAttribute('href');
      console.log(`href属性: ${href}`);
      
      // リンクをクリック
      await dashboardLink.click();
      
      // ナビゲーションを待つ
      await page.waitForTimeout(2000);
      
      const currentUrl = page.url();
      console.log(`\n現在のURL: ${currentUrl}`);
      
      if (currentUrl.includes('/dashboard')) {
        console.log('✓ ダッシュボードへ正常に遷移しました');
      } else {
        console.log('❌ ダッシュボードへ遷移できませんでした');
      }
    }
    
    // 手動確認用に15秒待機
    console.log('\n手動確認用に15秒待機します...');
    await page.waitForTimeout(15000);
  });
});