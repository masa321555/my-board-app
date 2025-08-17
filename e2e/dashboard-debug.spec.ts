import { test, expect } from '@playwright/test';

test.describe('ダッシュボードデバッグ', () => {
  test('ダッシュボードリンクの詳細デバッグ', async ({ page }) => {
    console.log('=== ダッシュボードリンクデバッグ ===\n');
    
    // コンソールログを監視
    page.on('console', (msg) => {
      console.log(`[Console ${msg.type()}]:`, msg.text());
    });
    
    // ネットワークエラーを監視
    page.on('requestfailed', request => {
      console.log(`[Request Failed]: ${request.url()} - ${request.failure()?.errorText}`);
    });
    
    // ページエラーを監視
    page.on('pageerror', error => {
      console.log(`[Page Error]:`, error.message);
    });
    
    // 1. ログイン
    console.log('1. ログイン');
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
    console.log('  現在のURL:', page.url());
    
    // 3. ダッシュボードボタンの詳細を確認
    console.log('\n3. ダッシュボードボタンの詳細確認');
    const dashboardButton = page.locator('button:has-text("ダッシュボード")').first();
    
    // ボタンの属性を取得
    const buttonHandle = await dashboardButton.elementHandle();
    if (buttonHandle) {
      const attributes = await buttonHandle.evaluate(el => {
        const attrs: any = {};
        for (let i = 0; i < el.attributes.length; i++) {
          const attr = el.attributes[i];
          attrs[attr.name] = attr.value;
        }
        return attrs;
      });
      console.log('  ボタンの属性:', JSON.stringify(attributes, null, 2));
      
      // イベントリスナーの確認
      const hasClickListener = await buttonHandle.evaluate(el => {
        // @ts-ignore
        return typeof el.onclick === 'function' || el._listeners?.click?.length > 0;
      });
      console.log('  クリックリスナー:', hasClickListener);
    }
    
    // 4. クリックイベントをインターセプト
    console.log('\n4. クリックイベントをインターセプト');
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const button = buttons.find(b => b.textContent?.includes('ダッシュボード')) as HTMLButtonElement;
      if (button) {
        const originalOnClick = button.onclick;
        button.onclick = function(e) {
          console.log('Button clicked!', e);
          if (originalOnClick) {
            return originalOnClick.call(this, e);
          }
        };
        
        // React のイベントハンドラを確認
        const reactProps = Object.keys(button).find(key => key.startsWith('__reactProps'));
        if (reactProps) {
          // @ts-ignore
          console.log('React props found:', button[reactProps]);
        }
      }
    });
    
    // 5. ダッシュボードボタンをクリック
    console.log('\n5. ダッシュボードボタンをクリック');
    
    // クリック前のURL
    const urlBefore = page.url();
    console.log('  クリック前のURL:', urlBefore);
    
    // クリック
    await dashboardButton.click();
    
    // しばらく待つ
    await page.waitForTimeout(3000);
    
    // クリック後のURL
    const urlAfter = page.url();
    console.log('  クリック後のURL:', urlAfter);
    
    if (urlBefore === urlAfter) {
      console.log('  ❌ URLが変わっていません');
      
      // JavaScriptでの直接ナビゲーション試行
      console.log('\n6. JavaScriptで直接ナビゲーションを試行');
      await page.evaluate(() => {
        window.location.href = '/dashboard';
      });
      
      await page.waitForTimeout(2000);
      console.log('  直接ナビゲーション後のURL:', page.url());
    } else {
      console.log('  ✓ ダッシュボードへ遷移しました');
    }
    
    // 7. Next.js のルーターを確認
    console.log('\n7. Next.js ルーターの状態を確認');
    const routerState = await page.evaluate(() => {
      // @ts-ignore
      if (window.next?.router) {
        // @ts-ignore
        return {
          pathname: window.next.router.pathname,
          asPath: window.next.router.asPath,
          // @ts-ignore
          isReady: window.next.router.isReady,
        };
      }
      return null;
    });
    console.log('  ルーターの状態:', routerState);
    
    // 10秒待機
    console.log('\n8. ブラウザで確認してください（10秒待機）');
    await page.waitForTimeout(10000);
  });
});