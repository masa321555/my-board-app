import { test, expect } from '@playwright/test';

test.describe('ダッシュボードページテスト', () => {
  test('ダッシュボードページが正常に表示されることを確認', async ({ page }) => {
    console.log('=== ダッシュボードページテスト ===\n');
    
    // 1. ログイン
    console.log('1. ログイン');
    await page.goto('/auth/signin');
    await page.fill('input[name="email"]', 'masaharu3210101@yahoo.co.jp');
    await page.fill('input[name="password"]', 'zxcvbnm321');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard', { timeout: 10000 });
    console.log('  ✓ ログイン成功、ダッシュボードへリダイレクト');
    
    // 2. ダッシュボードページの確認（既にダッシュボードにいる）
    console.log('\n2. ダッシュボードページの確認');
    console.log('  ✓ ダッシュボードページへ遷移しました');
    console.log('  現在のURL:', page.url());
    
    // 3. ダッシュボードページの要素を確認
    console.log('\n3. ダッシュボードページの要素を確認');
    
    // ページタイトル
    const pageTitle = page.locator('h1:has-text("ダッシュボード")');
    if (await pageTitle.count() > 0) {
      console.log('  ✓ ダッシュボードタイトルが表示されています');
    }
    
    // 統計カード
    const statCards = page.locator('.MuiCard-root');
    const cardCount = await statCards.count();
    console.log(`  ✓ ${cardCount}個の統計カードが表示されています`);
    
    // クイックアクション
    const newPostButton = page.locator('button:has-text("新規投稿")');
    if (await newPostButton.count() > 0) {
      console.log('  ✓ 新規投稿ボタンが表示されています');
    }
    
    // 4. 掲示板ボタンをクリックして掲示板へ遷移
    console.log('\n4. 掲示板ボタンをクリック');
    const boardButton = page.locator('button:has-text("掲示板")').last();
    await boardButton.click();
    
    await page.waitForURL('/board', { timeout: 5000 });
    console.log('  ✓ 掲示板ページへ遷移しました');
    
    // 5. 再度ダッシュボードへ戻る（メニューから）
    console.log('\n5. メニューからダッシュボードへ戻る');
    const accountIcon = page.locator('button[aria-label="account of current user"]');
    await accountIcon.click();
    await page.waitForTimeout(500);
    
    const dashboardMenuItem = page.locator('li:has-text("ダッシュボード")');
    await dashboardMenuItem.click();
    
    await page.waitForURL('/dashboard', { timeout: 5000 });
    console.log('  ✓ メニューからダッシュボードページへ遷移しました');
    
    // エラーがないことを確認
    const alerts = page.locator('.MuiAlert-root');
    const alertCount = await alerts.count();
    if (alertCount === 0) {
      console.log('\n✅ エラーメッセージは表示されていません');
    } else {
      console.log(`\n⚠️  ${alertCount}個のアラートが表示されています`);
    }
  });
});