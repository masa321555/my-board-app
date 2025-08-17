import { test, expect } from '@playwright/test';

test.describe('Chrome固有の問題調査', () => {
  test('Chromeでダッシュボードリンクの動作を確認', async ({ browserName, page }) => {
    console.log('=== Chrome固有の問題調査 ===');
    console.log('ブラウザ:', browserName);
    
    // コンソールメッセージを全て記録
    const consoleMessages: string[] = [];
    page.on('console', (msg) => {
      const text = `[${msg.type()}] ${msg.text()}`;
      consoleMessages.push(text);
      if (msg.type() === 'error' || msg.type() === 'warning') {
        console.log(text);
      }
    });
    
    // ネットワークエラーを記録
    page.on('requestfailed', request => {
      console.log(`[Request Failed]: ${request.url()} - ${request.failure()?.errorText}`);
    });
    
    // 1. ログイン
    console.log('\n1. ログイン');
    await page.goto('/auth/signin');
    await page.fill('input[name="email"]', 'masaharu3210101@yahoo.co.jp');
    await page.fill('input[name="password"]', 'zxcvbnm321');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard', { timeout: 10000 });
    console.log('  ✓ ログイン成功');
    
    // 2. 掲示板へ移動
    console.log('\n2. 掲示板へ移動');
    await page.goto('/board');
    await page.waitForLoadState('networkidle');
    
    // 3. ヘッダーの要素を詳しく調査
    console.log('\n3. ヘッダーの要素を調査');
    
    // aタグを探す
    const dashboardLinks = await page.locator('a[href="/dashboard"]').all();
    console.log(`  <a>タグの数: ${dashboardLinks.length}`);
    
    // buttonタグを探す
    const dashboardButtons = await page.locator('button:has-text("ダッシュボード")').all();
    console.log(`  <button>タグの数: ${dashboardButtons.length}`);
    
    // 実際のHTML構造を取得
    const headerHtml = await page.locator('header').innerHTML();
    const dashboardAreaMatch = headerHtml.match(/ダッシュボード.*?<\/[^>]+>/s);
    if (dashboardAreaMatch) {
      console.log('\n  ダッシュボード周辺のHTML:');
      console.log('  ' + dashboardAreaMatch[0].substring(0, 200));
    }
    
    // 4. クリックイベントをテスト
    console.log('\n4. クリックイベントをテスト');
    
    if (dashboardLinks.length > 0) {
      console.log('  <a>タグをクリック');
      await dashboardLinks[0].click();
    } else if (dashboardButtons.length > 0) {
      console.log('  <button>タグをクリック');
      await dashboardButtons[0].click();
    }
    
    // 5. 結果を確認
    await page.waitForTimeout(3000);
    const currentUrl = page.url();
    console.log('\n5. 結果');
    console.log('  現在のURL:', currentUrl);
    
    if (currentUrl.includes('/dashboard')) {
      console.log('  ✓ ダッシュボードへ遷移しました');
    } else {
      console.log('  ❌ ダッシュボードへ遷移できませんでした');
      
      // JavaScriptエラーがないか確認
      console.log('\n  コンソールメッセージ:');
      consoleMessages.forEach(msg => console.log('    ' + msg));
    }
    
    // 6. 追加の診断情報
    console.log('\n6. 追加の診断情報');
    
    // イベントリスナーの状態を確認
    const hasClickHandler = await page.evaluate(() => {
      const link = document.querySelector('a[href="/dashboard"]');
      if (link) {
        const events = (link as any)._events || {};
        return Object.keys(events).length > 0;
      }
      return false;
    });
    console.log('  クリックハンドラー:', hasClickHandler);
    
    // 10秒待機
    console.log('\n7. ブラウザで手動確認（10秒待機）');
    await page.waitForTimeout(10000);
  });
});