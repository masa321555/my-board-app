import { test, expect } from '@playwright/test';

test.describe('最終ダッシュボード確認', () => {
  test('ダッシュボードリンクの最終確認', async ({ page }) => {
    console.log('=== ダッシュボードリンクの最終確認 ===\n');
    
    // エラーを監視
    page.on('pageerror', error => {
      console.log(`[Page Error]:`, error.message);
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
    
    // 3. ヘッダーのダッシュボードリンクを確認
    console.log('\n3. ヘッダーのダッシュボードリンクを確認');
    
    // Linkコンポーネントとして実装されているか確認
    const dashboardLink = page.locator('a[href="/dashboard"]').first();
    const linkCount = await dashboardLink.count();
    
    if (linkCount > 0) {
      console.log('  ✓ ダッシュボードリンク（<a>タグ）が見つかりました');
      await dashboardLink.click();
    } else {
      console.log('  ダッシュボードボタンを探します');
      const dashboardButton = page.locator('button:has-text("ダッシュボード")').first();
      await dashboardButton.click();
    }
    
    // 4. ナビゲーション結果を確認
    await page.waitForTimeout(2000);
    const currentUrl = page.url();
    console.log('\n4. ナビゲーション結果');
    console.log('  現在のURL:', currentUrl);
    
    if (currentUrl.includes('/dashboard')) {
      console.log('  ✓ ダッシュボードへ正常に遷移しました');
      
      // ダッシュボードページの内容を確認
      const dashboardTitle = await page.locator('h1:has-text("ダッシュボード")').count();
      if (dashboardTitle > 0) {
        console.log('  ✓ ダッシュボードページが正常に表示されています');
      }
    } else {
      console.log('  ❌ ダッシュボードへ遷移できませんでした');
    }
    
    // 15秒待機して手動確認
    console.log('\n5. ブラウザで手動確認してください（15秒待機）');
    await page.waitForTimeout(15000);
  });
});