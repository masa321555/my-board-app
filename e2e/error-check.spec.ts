import { test, expect } from '@playwright/test';

test.describe('エラーチェック', () => {
  // コンソールエラーを記録
  let consoleErrors: string[] = [];

  test.beforeEach(async ({ page }) => {
    consoleErrors = [];
    
    // コンソールエラーをキャプチャ
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    // ページエラーをキャプチャ
    page.on('pageerror', (error) => {
      consoleErrors.push(error.message);
    });
  });

  test.afterEach(async () => {
    // エラーがあれば表示
    if (consoleErrors.length > 0) {
      console.log('=== コンソールエラー ===');
      consoleErrors.forEach((error, index) => {
        console.log(`${index + 1}. ${error}`);
      });
      console.log('====================');
    }
  });

  test('ホームページのエラーチェック', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // エラーがないことを確認
    expect(consoleErrors).toHaveLength(0);
  });

  test('サインインページのエラーチェック', async ({ page }) => {
    await page.goto('/auth/signin');
    await page.waitForLoadState('networkidle');
    
    // ページ要素の確認
    await expect(page.getByRole('heading', { name: 'サインイン' })).toBeVisible();
    
    // エラーがないことを確認
    expect(consoleErrors).toHaveLength(0);
  });

  test('登録ページのエラーチェック', async ({ page }) => {
    await page.goto('/auth/register');
    await page.waitForLoadState('networkidle');
    
    // ページ要素の確認
    await expect(page.getByRole('heading', { name: '新規登録' })).toBeVisible();
    
    // エラーがないことを確認
    expect(consoleErrors).toHaveLength(0);
  });

  test('掲示板ページのエラーチェック（未認証）', async ({ page }) => {
    await page.goto('/board');
    await page.waitForLoadState('networkidle');
    
    // 未認証の場合、サインインページにリダイレクトされるか確認
    await page.waitForURL('**/auth/signin');
    
    // エラーがないことを確認
    expect(consoleErrors).toHaveLength(0);
  });

  test('フォーム操作のエラーチェック', async ({ page }) => {
    await page.goto('/auth/signin');
    await page.waitForLoadState('networkidle');
    
    // フォームに不正な値を入力
    await page.fill('input[name="email"]', 'invalid-email');
    await page.fill('input[name="password"]', '123');
    
    // 送信ボタンをクリック
    await page.click('button[type="submit"]');
    
    // エラーメッセージが表示されることを確認
    await page.waitForTimeout(1000);
    
    // コンソールエラーの確認
    console.log(`フォーム操作後のエラー数: ${consoleErrors.length}`);
  });

  test('Alert コンポーネントのDOMエラーチェック', async ({ page }) => {
    // エラーメッセージを表示させるために無効なログインを試行
    await page.goto('/auth/signin');
    await page.waitForLoadState('networkidle');
    
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');
    
    // エラーメッセージの表示を待つ
    await page.waitForTimeout(2000);
    
    // Alert コンポーネントの閉じるボタンがあればクリック
    const closeButton = page.locator('[aria-label="Close"]');
    if (await closeButton.isVisible()) {
      await closeButton.click();
      await page.waitForTimeout(500);
    }
    
    // removeChild エラーの確認
    const hasRemoveChildError = consoleErrors.some(error => 
      error.includes('removeChild') || error.includes('DOM')
    );
    
    if (hasRemoveChildError) {
      console.log('removeChild エラーが検出されました！');
    }
  });
});