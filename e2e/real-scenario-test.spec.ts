import { test, expect } from '@playwright/test';

test.describe('実際の使用シナリオテスト', () => {
  test('ログイン試行の実際のシナリオ', async ({ page }) => {
    let removeChildError = false;
    const allErrors: string[] = [];
    
    // すべてのエラーをキャプチャ
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        const text = msg.text();
        allErrors.push(text);
        if (text.includes('removeChild') || text.includes('NotFoundError')) {
          console.log(`\n❌ DOMエラー検出: ${text}\n`);
          removeChildError = true;
        }
      }
    });

    page.on('pageerror', (error) => {
      const message = error.message;
      allErrors.push(message);
      if (message.includes('removeChild') || message.includes('NotFoundError')) {
        console.log(`\n❌ ページエラー検出: ${message}\n`);
        removeChildError = true;
      }
    });

    console.log('=== 実際の使用シナリオテスト ===\n');

    // 1. サインインページへ移動
    console.log('1. サインインページへ移動');
    await page.goto('/auth/signin');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // 2. 初回のログイン失敗
    console.log('\n2. 初回のログイン失敗（間違ったパスワード）');
    await page.fill('input[name="email"]', 'user@example.com');
    await page.fill('input[name="password"]', 'wrongpassword123');
    await page.click('button[type="submit"]');
    
    // APIレスポンスを待つ
    await page.waitForTimeout(3000);
    
    // エラーアラートの確認
    const alert = page.locator('.MuiAlert-root').first();
    const isAlertVisible = await alert.isVisible();
    console.log(`  - エラーアラート表示: ${isAlertVisible ? '✓' : '✗'}`);

    if (isAlertVisible) {
      // 3. エラーを閉じる
      console.log('\n3. エラーアラートを閉じる');
      const closeBtn = alert.locator('button[aria-label="Close"]');
      if (await closeBtn.isVisible()) {
        await closeBtn.click();
        console.log('  - 閉じるボタンをクリック');
        await page.waitForTimeout(1000);
      }
    }

    // 4. フォームを修正して再試行
    console.log('\n4. フォームを修正して再試行');
    await page.fill('input[name="email"]', 'correct@example.com');
    await page.fill('input[name="password"]', 'correctpassword');
    await page.click('button[type="submit"]');
    
    await page.waitForTimeout(3000);
    
    // 5. 再度間違った情報で試行
    console.log('\n5. 再度間違った情報で試行');
    await page.fill('input[name="email"]', 'another@example.com');
    await page.fill('input[name="password"]', 'anotherwrong');
    await page.click('button[type="submit"]');
    
    await page.waitForTimeout(3000);

    // 結果表示
    console.log('\n=== テスト結果 ===');
    console.log(`総エラー数: ${allErrors.length}`);
    
    if (removeChildError) {
      console.log('\n❌ removeChildエラーが検出されました！');
      console.log('エラー詳細:');
      allErrors.forEach((err, index) => {
        if (err.includes('removeChild') || err.includes('NotFoundError')) {
          console.log(`${index + 1}. ${err}`);
        }
      });
    } else {
      console.log('\n✅ removeChildエラーは検出されませんでした');
    }

    // removeChildエラーがないことを確認
    expect(removeChildError).toBe(false);
  });

  test('高速操作でのテスト', async ({ page }) => {
    let removeChildError = false;
    
    page.on('console', (msg) => {
      if (msg.type() === 'error' && (msg.text().includes('removeChild') || msg.text().includes('NotFoundError'))) {
        removeChildError = true;
        console.log(`エラー検出: ${msg.text()}`);
      }
    });

    console.log('=== 高速操作テスト ===\n');

    await page.goto('/auth/signin');
    await page.waitForLoadState('networkidle');

    // 高速で複数回エラーを発生させる
    for (let i = 0; i < 5; i++) {
      console.log(`\n試行 ${i + 1}/5`);
      
      // ランダムなメールとパスワード
      await page.fill('input[name="email"]', `test${i}@example.com`);
      await page.fill('input[name="password"]', `wrong${i}`);
      await page.click('button[type="submit"]');
      
      // 短い待機時間
      await page.waitForTimeout(500);
      
      // アラートが表示されていれば閉じる
      const alert = page.locator('.MuiAlert-root').first();
      if (await alert.isVisible()) {
        const closeBtn = alert.locator('button[aria-label="Close"]');
        if (await closeBtn.isVisible()) {
          await closeBtn.click();
          await page.waitForTimeout(200);
        }
      }
    }

    console.log(`\n結果: ${removeChildError ? '❌ エラー検出' : '✅ エラーなし'}`);
    expect(removeChildError).toBe(false);
  });
});