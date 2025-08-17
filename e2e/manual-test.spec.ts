import { test, expect } from '@playwright/test';

test.describe('手動確認テスト', () => {
  test('30秒間ブラウザを開いて手動確認', async ({ page }) => {
    console.log('=== 手動確認テスト ===\n');
    console.log('ブラウザが開きます。手動でダッシュボードリンクをテストしてください。\n');
    
    // ログイン
    await page.goto('/auth/signin');
    await page.fill('input[name="email"]', 'masaharu3210101@yahoo.co.jp');
    await page.fill('input[name="password"]', 'zxcvbnm321');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard', { timeout: 10000 });
    
    // 掲示板へ移動
    await page.goto('/board');
    
    console.log('掲示板ページが表示されました。');
    console.log('ヘッダーの「ダッシュボード」ボタンをクリックしてください。');
    console.log('動作を確認したら、ブラウザのコンソールもチェックしてください。\n');
    
    // 30秒待機
    await page.waitForTimeout(30000);
    
    console.log('\nテスト終了');
  });
});