import { test, expect } from '@playwright/test';

test.describe('フォーム操作とエラーチェック', () => {
  test('サインインフォームの操作とAlert表示確認', async ({ page }) => {
    const errors: string[] = [];
    
    // コンソールエラーをキャプチャ（401エラーは除外）
    page.on('console', (msg) => {
      if (msg.type() === 'error' && !msg.text().includes('401')) {
        console.log(`❌ コンソールエラー: ${msg.text()}`);
        errors.push(msg.text());
      }
    });

    // ページに移動
    await page.goto('/auth/signin');
    await page.waitForLoadState('networkidle');
    
    // フォームが表示されることを確認
    await expect(page.locator('h1:has-text("ログイン")')).toBeVisible();
    
    // 1. 無効なメールアドレスでフォーム送信
    console.log('\n=== 無効なメールアドレスでテスト ===');
    await page.fill('input[name="email"]', 'invalid-email');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(1000);
    
    // エラーメッセージを確認
    const validationError = page.locator('text=有効なメールアドレスを入力してください');
    if (await validationError.isVisible()) {
      console.log('✓ バリデーションエラーが表示されました');
    }
    
    // 2. 正しい形式で間違った認証情報
    console.log('\n=== 間違った認証情報でテスト ===');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');
    
    // エラーアラートを待つ
    await page.waitForTimeout(2000);
    
    // Alertコンポーネントの確認（MUI Alertを特定）
    const alertElement = page.locator('.MuiAlert-root');
    if (await alertElement.isVisible()) {
      console.log('✓ エラーアラートが表示されました');
      const alertText = await alertElement.textContent();
      console.log(`  アラート内容: ${alertText}`);
      
      // 閉じるボタンの確認
      const closeButton = page.locator('.MuiAlert-root button[aria-label="Close"]');
      if (await closeButton.isVisible()) {
        console.log('✓ 閉じるボタンが見つかりました');
        
        // 閉じるボタンをクリック
        await closeButton.click();
        console.log('✓ 閉じるボタンをクリックしました');
        await page.waitForTimeout(500);
        
        // Alertが消えたか確認
        if (!(await alertElement.isVisible())) {
          console.log('✓ アラートが正常に閉じられました');
        } else {
          console.log('❌ アラートが閉じられませんでした');
        }
      } else {
        console.log('⚠️  閉じるボタンが見つかりません');
      }
    }
    
    // 3. パスワード表示切替のテスト
    console.log('\n=== パスワード表示切替テスト ===');
    const passwordInput = page.locator('input[name="password"]');
    const toggleButton = page.locator('[aria-label*="password"]');
    
    // 初期状態の確認
    const initialType = await passwordInput.getAttribute('type');
    console.log(`初期状態: type="${initialType}"`);
    
    // トグルボタンをクリック
    await toggleButton.click();
    await page.waitForTimeout(200);
    
    const newType = await passwordInput.getAttribute('type');
    console.log(`クリック後: type="${newType}"`);
    
    if (initialType !== newType) {
      console.log('✓ パスワード表示が切り替わりました');
    }
    
    // エラーサマリー
    console.log('\n=== エラーサマリー ===');
    if (errors.length === 0) {
      console.log('✅ DOMエラーは検出されませんでした');
    } else {
      console.log(`❌ ${errors.length}個のエラーが検出されました`);
      const removeChildErrors = errors.filter(e => e.includes('removeChild'));
      if (removeChildErrors.length > 0) {
        console.log(`  - removeChildエラー: ${removeChildErrors.length}個`);
      }
    }
    
    expect(errors).toHaveLength(0);
  });
});