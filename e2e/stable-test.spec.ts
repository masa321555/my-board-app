import { test, expect } from '@playwright/test';

test.describe('StableAlert動作確認', () => {
  test('removeChildエラーが発生しないことを確認', async ({ page }) => {
    console.log('=== StableAlert動作確認テスト ===\n');
    
    let hasRemoveChildError = false;
    const errors: string[] = [];
    
    // エラー監視
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        const text = msg.text();
        errors.push(text);
        
        if (text.includes('removeChild') || text.includes('NotFoundError')) {
          hasRemoveChildError = true;
          console.log('❌ removeChildエラー検出:', text);
        }
      }
    });
    
    page.on('pageerror', (error) => {
      const message = error.message;
      errors.push(message);
      
      if (message.includes('removeChild') || message.includes('NotFoundError')) {
        hasRemoveChildError = true;
        console.log('❌ ページエラー:', message);
      }
    });
    
    // 1. サインインページ
    console.log('1. サインインページのテスト');
    await page.goto('/auth/signin');
    await page.waitForLoadState('networkidle');
    
    // エラーを発生させる
    await page.fill('input[name="email"]', 'invalid@example.com');
    await page.fill('input[name="password"]', 'wrong');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(2000);
    
    // StableAlertが表示されているか確認
    const alertBox = page.locator('[role="alert"], div:has-text("メールアドレスまたはパスワードが正しくありません")').first();
    if (await alertBox.count() > 0) {
      console.log('  ✓ エラーメッセージが表示されました');
      
      // 閉じるボタンをクリック
      const closeBtn = page.locator('button[aria-label*="Close"], button:has(svg)').first();
      if (await closeBtn.count() > 0) {
        await closeBtn.click();
        await page.waitForTimeout(500);
        console.log('  ✓ 閉じるボタンをクリックしました');
      }
    }
    
    // 2. 登録ページ
    console.log('\n2. 登録ページのテスト');
    await page.goto('/auth/register');
    await page.waitForLoadState('networkidle');
    
    // パスワード不一致エラーを発生させる
    await page.fill('input[name="name"]', 'テストユーザー');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.fill('input[name="confirmPassword"]', 'different');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(1000);
    
    // 3. 実際のログインテスト
    console.log('\n3. 実際のログインテスト');
    await page.goto('/auth/signin');
    await page.waitForLoadState('networkidle');
    
    await page.fill('input[name="email"]', 'masaharu3210101@yahoo.co.jp');
    await page.fill('input[name="password"]', 'zxcvbnm321');
    await page.click('button[type="submit"]');
    
    try {
      await page.waitForURL('/board', { timeout: 10000 });
      console.log('  ✓ ログイン成功！');
    } catch {
      console.log('  ⚠️  ログインに失敗しました（認証の問題）');
    }
    
    // 結果
    console.log('\n=== テスト結果 ===');
    if (hasRemoveChildError) {
      console.log('❌ removeChildエラーが検出されました');
      console.log('\nエラー詳細:');
      errors.forEach((err, i) => {
        console.log(`${i + 1}. ${err}`);
      });
    } else {
      console.log('✅ removeChildエラーは検出されませんでした');
      console.log(`その他のエラー数: ${errors.length}`);
    }
    
    expect(hasRemoveChildError).toBe(false);
  });
});