import { test, expect } from '@playwright/test';

test.describe('実際のログインテスト', () => {
  test('ユーザーがログインできることを確認', async ({ page }) => {
    console.log('=== ログインテスト開始 ===\n');
    
    // エラー監視
    let hasError = false;
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        console.log('❌ コンソールエラー:', msg.text());
        hasError = true;
      }
    });
    
    page.on('pageerror', (error) => {
      console.log('❌ ページエラー:', error.message);
      hasError = true;
    });
    
    // サインインページへ移動
    await page.goto('/auth/signin');
    await page.waitForLoadState('networkidle');
    
    // ログイン情報を入力
    console.log('1. ログイン情報を入力');
    await page.fill('input[name="email"]', 'masaharu3210101@yahoo.co.jp');
    await page.fill('input[name="password"]', 'zxcvbnm321');
    
    // ログインボタンをクリック
    console.log('2. ログインボタンをクリック');
    await page.click('button[type="submit"]');
    
    // ログイン処理を待つ
    console.log('3. ログイン処理を待機中...');
    
    // 成功時は掲示板ページへリダイレクトされる
    try {
      await page.waitForURL('/board', { timeout: 10000 });
      console.log('✅ ログイン成功！掲示板ページへリダイレクトされました');
      
      // ユーザー名が表示されているか確認
      const userName = await page.locator('text=マサハル').first();
      if (await userName.count() > 0) {
        console.log('✅ ユーザー名「マサハル」が表示されています');
      }
    } catch (error) {
      // ログインに失敗した場合
      console.log('❌ ログインに失敗しました');
      
      // エラーメッセージを確認
      const errorAlert = page.locator('.MuiAlert-root');
      if (await errorAlert.count() > 0) {
        const errorText = await errorAlert.textContent();
        console.log('エラーメッセージ:', errorText);
      }
      
      // 現在のURLを確認
      console.log('現在のURL:', page.url());
    }
    
    // エラーチェック
    expect(hasError).toBe(false);
  });
});