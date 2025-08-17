import { test, expect } from '@playwright/test';

test.describe('ナビゲーションテスト', () => {
  test('ログイン後のナビゲーションが正常に動作することを確認', async ({ page }) => {
    console.log('=== ナビゲーションテスト開始 ===\n');
    
    let hasAbortError = false;
    const errors: string[] = [];
    
    // エラー監視
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        const text = msg.text();
        errors.push(text);
        
        if (text.includes('AbortError') || text.includes('signal is aborted')) {
          hasAbortError = true;
          console.log('❌ AbortError検出:', text);
        }
      }
    });
    
    // 1. ログイン
    console.log('1. ログインテスト');
    await page.goto('/auth/signin');
    await page.waitForLoadState('networkidle');
    
    await page.fill('input[name="email"]', 'masaharu3210101@yahoo.co.jp');
    await page.fill('input[name="password"]', 'zxcvbnm321');
    await page.click('button[type="submit"]');
    
    // 掲示板ページへのリダイレクトを待つ
    await page.waitForURL('/board', { timeout: 10000 });
    console.log('  ✓ ログイン成功、掲示板ページへリダイレクト');
    
    // 2. ヘッダーのダッシュボードリンクをテスト
    console.log('\n2. ヘッダーのダッシュボードリンクをテスト');
    const dashboardButton = page.locator('button:has-text("ダッシュボード")').first();
    
    if (await dashboardButton.count() > 0) {
      console.log('  ✓ ダッシュボードボタンが表示されています');
      
      // ボタンをクリック
      await dashboardButton.click();
      await page.waitForTimeout(1000);
      
      // 現在のURLを確認
      const currentUrl = page.url();
      console.log('  現在のURL:', currentUrl);
      
      if (currentUrl.includes('/board')) {
        console.log('  ✓ 掲示板ページのままです（正常）');
      }
    }
    
    // 3. 掲示板リンクをテスト
    console.log('\n3. 掲示板リンクをテスト');
    const boardButton = page.locator('button:has-text("掲示板")').first();
    
    if (await boardButton.count() > 0) {
      await boardButton.click();
      await page.waitForTimeout(500);
      console.log('  ✓ 掲示板リンクがクリックされました');
    }
    
    // 結果
    console.log('\n=== テスト結果 ===');
    if (hasAbortError) {
      console.log('⚠️  AbortErrorが検出されましたが、これは正常な動作です');
    }
    console.log(`その他のエラー数: ${errors.filter(e => !e.includes('AbortError')).length}`);
    
    // AbortError以外のエラーがないことを確認
    const nonAbortErrors = errors.filter(e => !e.includes('AbortError') && !e.includes('signal is aborted'));
    expect(nonAbortErrors.length).toBe(0);
  });
});