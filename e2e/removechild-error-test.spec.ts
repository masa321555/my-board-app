import { test, expect } from '@playwright/test';

test.describe('removeChildエラーのテスト', () => {
  test('サインインページでエラー表示と閉じるボタンの操作', async ({ page }) => {
    const errors: string[] = [];
    let removeChildErrorDetected = false;
    
    // コンソールエラーをキャプチャ
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        const text = msg.text();
        if (text.includes('removeChild')) {
          console.log(`❌ removeChildエラーが検出されました: ${text}`);
          removeChildErrorDetected = true;
        }
        if (!text.includes('401') && !text.includes('Failed to load resource')) {
          errors.push(text);
        }
      }
    });

    // ページエラーをキャプチャ
    page.on('pageerror', (error) => {
      const message = error.message;
      if (message.includes('removeChild')) {
        console.log(`❌ removeChildエラーが検出されました: ${message}`);
        removeChildErrorDetected = true;
      }
      errors.push(message);
    });

    console.log('=== removeChildエラーテスト開始 ===\n');

    // サインインページに移動
    await page.goto('/auth/signin');
    await page.waitForLoadState('networkidle');
    console.log('✓ サインインページが読み込まれました');

    // エラーを発生させる（間違った認証情報）
    console.log('\n1. エラーアラートを表示させる');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');
    
    // エラーアラートが表示されるまで待つ
    await page.waitForTimeout(2000);
    
    const alert = page.locator('.MuiAlert-root');
    if (await alert.isVisible()) {
      console.log('✓ エラーアラートが表示されました');
      
      // 閉じるボタンをクリック
      const closeBtn = alert.locator('button[aria-label="Close"]');
      if (await closeBtn.isVisible()) {
        console.log('\n2. 閉じるボタンをクリック');
        await closeBtn.click();
        await page.waitForTimeout(1000);
        
        if (!(await alert.isVisible())) {
          console.log('✓ アラートが正常に閉じられました');
        }
      }
    }

    // 再度エラーを表示させる
    console.log('\n3. 再度エラーを表示させる');
    await page.fill('input[name="password"]', 'anotherWrongPassword');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(2000);

    if (await alert.isVisible()) {
      console.log('✓ エラーアラートが再度表示されました');
    }

    // フォームをクリアして正常な状態に戻す
    console.log('\n4. フォームをクリア');
    await page.fill('input[name="email"]', '');
    await page.fill('input[name="password"]', '');
    await page.waitForTimeout(1000);

    // 結果
    console.log('\n=== テスト結果 ===');
    if (removeChildErrorDetected) {
      console.log('❌ removeChildエラーが検出されました！');
    } else {
      console.log('✅ removeChildエラーは検出されませんでした');
    }

    console.log(`その他のエラー数: ${errors.length}`);
    
    expect(removeChildErrorDetected).toBe(false);
  });

  test('複数ページでのAlert表示テスト', async ({ page }) => {
    let removeChildErrorDetected = false;
    
    page.on('console', (msg) => {
      if (msg.type() === 'error' && msg.text().includes('removeChild')) {
        removeChildErrorDetected = true;
      }
    });

    page.on('pageerror', (error) => {
      if (error.message.includes('removeChild')) {
        removeChildErrorDetected = true;
      }
    });

    console.log('=== 複数ページでのAlertテスト ===\n');

    // 1. 登録ページ
    console.log('1. 登録ページでのテスト');
    await page.goto('/auth/register');
    await page.waitForLoadState('networkidle');
    
    // 不正なメールアドレスで送信
    await page.fill('input[name="email"]', 'invalid-email');
    await page.fill('input[name="password"]', 'pass');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(1000);
    console.log('  - バリデーションエラーをテスト');

    // 2. パスワードリセットページ
    console.log('\n2. パスワードリセットページでのテスト');
    await page.goto('/auth/forgot-password');
    await page.waitForLoadState('networkidle');
    
    // 空のメールで送信
    await page.click('button[type="submit"]');
    await page.waitForTimeout(1000);
    console.log('  - バリデーションエラーをテスト');

    // 結果
    console.log('\n=== テスト結果 ===');
    if (removeChildErrorDetected) {
      console.log('❌ removeChildエラーが検出されました！');
    } else {
      console.log('✅ removeChildエラーは検出されませんでした');
    }

    expect(removeChildErrorDetected).toBe(false);
  });
});