import { test, expect } from '@playwright/test';

test.describe('実際のChrome環境の再現テスト', () => {
  test('Chromeでダッシュボードリンクをテスト - 手動待機あり', async ({ page }) => {
    console.log('=== 実際のChrome環境再現テスト ===\n');
    
    // ログイン
    await page.goto('/auth/signin');
    await page.fill('input[name="email"]', 'masaharu3210101@yahoo.co.jp');
    await page.fill('input[name="password"]', 'zxcvbnm321');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard', { timeout: 10000 });
    
    // 掲示板へ移動
    await page.goto('/board');
    await page.waitForLoadState('networkidle');
    
    console.log('現在、掲示板ページが表示されています。');
    console.log('\n【手動確認手順】');
    console.log('1. ヘッダーの「ダッシュボード」ボタンをクリックしてください');
    console.log('2. ダッシュボードに遷移するか確認してください');
    console.log('3. 遷移しない場合は、以下を確認してください：');
    console.log('   - コンソールにエラーが出ていないか');
    console.log('   - ボタンにマウスオーバーした時の挙動');
    console.log('   - ネットワークタブでリクエストが発生しているか');
    console.log('\n30秒間待機します...');
    
    await page.waitForTimeout(30000);
    
    const currentUrl = page.url();
    console.log('\n最終URL:', currentUrl);
  });
});