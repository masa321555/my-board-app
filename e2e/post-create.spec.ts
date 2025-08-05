import { test, expect } from '@playwright/test';

test.describe('投稿作成フロー', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // ページが完全に読み込まれるまで待機
    await page.waitForLoadState('networkidle');
  });

  test('新しい投稿を作成できる', async ({ page }) => {
    // 初期状態の確認
    await expect(page.locator('h1')).toHaveText('掲示板');
    await expect(page.locator('h6')).toHaveText('新しい投稿を作成');
    
    // 投稿内容を入力
    const postContent = `テスト投稿 ${Date.now()}`;
    await page.locator('textarea[placeholder*="何を投稿しますか"]').fill(postContent);
    
    // 文字数カウンターの確認
    const charCount = 200 - postContent.length;
    await expect(page.locator('text=' + charCount + '文字')).toBeVisible();
    
    // 投稿ボタンをクリック
    await page.locator('button:has-text("投稿")').click();
    
    // 投稿が表示されることを確認
    await expect(page.locator(`text="${postContent}"`)).toBeVisible({ timeout: 10000 });
    
    // フォームがクリアされることを確認
    await expect(page.locator('textarea[placeholder*="何を投稿しますか"]')).toHaveValue('');
  });

  test('空の投稿を送信しようとするとエラーが表示される', async ({ page }) => {
    // 空のまま投稿ボタンをクリック
    await page.locator('button:has-text("投稿")').click();
    
    // エラーメッセージが表示されることを確認
    await expect(page.locator('text=投稿内容を入力してください')).toBeVisible();
  });

  test('200文字を超える投稿を送信しようとするとエラーが表示される', async ({ page }) => {
    // 201文字の投稿を入力
    const longContent = 'あ'.repeat(201);
    await page.locator('textarea[placeholder*="何を投稿しますか"]').fill(longContent);
    
    // 文字数オーバーの表示を確認
    await expect(page.locator('text=文字数が上限を超えています')).toBeVisible();
    await expect(page.locator('text=-1文字')).toBeVisible();
    
    // 投稿ボタンが無効化されていることを確認
    await expect(page.locator('button:has-text("投稿")')).toBeDisabled();
  });

  test('投稿作成中はボタンが無効化される', async ({ page }) => {
    // APIレスポンスを遅延させるためのインターセプト
    await page.route('**/api/posts', async (route) => {
      if (route.request().method() === 'POST') {
        await new Promise(resolve => setTimeout(resolve, 1000));
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({
            _id: '123',
            content: 'テスト投稿',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }),
        });
      } else {
        await route.continue();
      }
    });
    
    // 投稿内容を入力
    await page.locator('textarea[placeholder*="何を投稿しますか"]').fill('テスト投稿');
    
    // 投稿ボタンをクリック
    const submitButton = page.locator('button:has-text("投稿")');
    await submitButton.click();
    
    // ボタンが「投稿中...」に変わることを確認
    await expect(submitButton).toHaveText('投稿中...');
    await expect(submitButton).toBeDisabled();
  });

  test('投稿がない場合、適切なメッセージが表示される', async ({ page }) => {
    // 空の投稿リストを返すようにインターセプト
    await page.route('**/api/posts', async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([]),
        });
      } else {
        await route.continue();
      }
    });
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // メッセージが表示されることを確認
    await expect(page.locator('text=まだ投稿がありません')).toBeVisible();
  });

  test('投稿の取得に失敗した場合エラーメッセージが表示される', async ({ page }) => {
    // エラーレスポンスを返すようにインターセプト
    await page.route('**/api/posts', async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: '投稿の取得に失敗しました' }),
        });
      } else {
        await route.continue();
      }
    });
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // エラーメッセージが表示されることを確認
    await expect(page.locator('text=投稿の取得に失敗しました。ページを再読み込みしてください。')).toBeVisible();
  });

  test('投稿の作成に失敗した場合エラーメッセージが表示される', async ({ page }) => {
    // エラーレスポンスを返すようにインターセプト
    await page.route('**/api/posts', async (route) => {
      if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: '投稿の作成に失敗しました' }),
        });
      } else {
        await route.continue();
      }
    });
    
    // 投稿内容を入力
    await page.locator('textarea[placeholder*="何を投稿しますか"]').fill('テスト投稿');
    
    // 投稿ボタンをクリック
    await page.locator('button:has-text("投稿")').click();
    
    // エラーメッセージが表示されることを確認
    await expect(page.locator('text=投稿に失敗しました。もう一度お試しください。')).toBeVisible();
  });
});