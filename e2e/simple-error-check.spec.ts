import { test } from '@playwright/test';

test('サインインページのエラーチェック', async ({ page }) => {
  // エラーを記録
  const errors: string[] = [];
  
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      console.log(`❌ コンソールエラー: ${msg.text()}`);
      errors.push(msg.text());
    }
  });

  page.on('pageerror', (error) => {
    console.log(`❌ ページエラー: ${error.message}`);
    errors.push(error.message);
  });

  // サインインページに移動
  console.log('サインインページを開いています...');
  await page.goto('http://localhost:3000/auth/signin');
  
  // ページが完全に読み込まれるまで待機
  await page.waitForTimeout(5000);
  
  // スクリーンショットを撮る
  await page.screenshot({ path: 'signin-page.png' });
  console.log('スクリーンショットを保存しました: signin-page.png');
  
  // ページの内容を確認
  const title = await page.title();
  console.log(`ページタイトル: ${title}`);
  
  const bodyText = await page.textContent('body');
  console.log(`ページ内容の一部: ${bodyText?.substring(0, 200)}...`);
  
  // エラーサマリー
  if (errors.length > 0) {
    console.log(`\n❌ ${errors.length}個のエラーが検出されました`);
  } else {
    console.log('\n✅ エラーは検出されませんでした');
  }
});