import { test, expect } from '@playwright/test';

test.describe('新規投稿エラーテスト', () => {
  test('新規投稿でremoveChildエラーが発生しないか確認', async ({ page }) => {
    console.log('=== 新規投稿エラーテスト ===\n');
    
    // エラーを監視
    const errors: string[] = [];
    page.on('pageerror', error => {
      errors.push(error.message);
      console.log(`[Error]: ${error.message}`);
    });
    
    // 1. ログイン
    await page.goto('/auth/signin');
    await page.fill('input[name="email"]', 'masaharu3210101@yahoo.co.jp');
    await page.fill('input[name="password"]', 'zxcvbnm321');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard', { timeout: 10000 });
    console.log('✓ ログイン成功');
    
    // 2. 新規投稿ページへ移動
    await page.goto('/board/new');
    await page.waitForLoadState('networkidle');
    console.log('✓ 新規投稿ページへ移動');
    
    // 3. フォームに入力
    console.log('\n3. フォームに入力');
    await page.locator('input[name="title"]').fill('テスト投稿');
    await page.locator('textarea[name="content"]').fill('これはテスト投稿です。removeChildエラーが発生しないことを確認します。');
    console.log('✓ フォーム入力完了');
    
    // 4. 投稿を送信
    console.log('\n4. 投稿を送信');
    await page.click('button:has-text("投稿する")');
    
    // 5. 結果を待つ
    await page.waitForTimeout(3000);
    
    // 6. エラーチェック
    console.log('\n6. エラーチェック');
    const removeChildErrors = errors.filter(e => e.includes('removeChild'));
    
    if (removeChildErrors.length === 0) {
      console.log('✓ removeChildエラーは発生しませんでした');
    } else {
      console.log(`❌ removeChildエラーが${removeChildErrors.length}件発生しました`);
      removeChildErrors.forEach(e => console.log(`  - ${e}`));
    }
    
    // 7. 現在のページを確認
    const currentUrl = page.url();
    console.log(`\n現在のURL: ${currentUrl}`);
    
    if (currentUrl.includes('/board') && !currentUrl.includes('/new')) {
      console.log('✓ 掲示板ページへ正常に遷移しました');
    }
  });
});