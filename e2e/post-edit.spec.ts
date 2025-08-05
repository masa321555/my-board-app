import { test, expect } from '@playwright/test';

test.describe('投稿編集フロー', () => {
  // テスト用の投稿データ
  const mockPosts = [
    {
      _id: '1',
      content: '最初の投稿',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      _id: '2',
      content: '2番目の投稿',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  test.beforeEach(async ({ page }) => {
    // 初期投稿データを返すようにインターセプト
    await page.route('**/api/posts', async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(mockPosts),
        });
      } else {
        await route.continue();
      }
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('投稿を編集できる', async ({ page }) => {
    // 編集ボタンをクリック
    await page.locator('[data-testid="EditIcon"]').first().click();
    
    // 編集モードになることを確認
    await expect(page.locator('h6')).toHaveText('投稿を編集');
    await expect(page.locator('textarea')).toHaveValue('最初の投稿');
    await expect(page.locator('button:has-text("キャンセル")')).toBeVisible();
    await expect(page.locator('button:has-text("更新")')).toBeVisible();
    
    // 編集APIのインターセプト
    await page.route('**/api/posts/1', async (route) => {
      if (route.request().method() === 'PUT') {
        const body = route.request().postDataJSON();
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            ...mockPosts[0],
            content: body.content,
            updatedAt: new Date().toISOString(),
          }),
        });
      }
    });
    
    // 内容を編集
    const newContent = '編集された投稿内容';
    await page.locator('textarea').fill(newContent);
    
    // 更新ボタンをクリック
    await page.locator('button:has-text("更新")').click();
    
    // 編集モードが解除されることを確認
    await expect(page.locator('h6')).toHaveText('新しい投稿を作成');
    
    // 更新された内容が表示されることを確認（再取得のインターセプト）
    await page.route('**/api/posts', async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([
            { ...mockPosts[0], content: newContent },
            mockPosts[1],
          ]),
        });
      }
    });
  });

  test('編集をキャンセルできる', async ({ page }) => {
    // 編集ボタンをクリック
    await page.locator('[data-testid="EditIcon"]').first().click();
    
    // 編集モードになることを確認
    await expect(page.locator('h6')).toHaveText('投稿を編集');
    
    // 内容を変更
    await page.locator('textarea').fill('変更された内容');
    
    // キャンセルボタンをクリック
    await page.locator('button:has-text("キャンセル")').click();
    
    // 編集モードが解除されることを確認
    await expect(page.locator('h6')).toHaveText('新しい投稿を作成');
    
    // フォームがクリアされることを確認
    await expect(page.locator('textarea')).toHaveValue('');
    
    // 元の投稿内容が変更されていないことを確認
    await expect(page.locator('text=最初の投稿')).toBeVisible();
  });

  test('編集時も文字数制限が適用される', async ({ page }) => {
    // 編集ボタンをクリック
    await page.locator('[data-testid="EditIcon"]').first().click();
    
    // 201文字の内容を入力
    const longContent = 'あ'.repeat(201);
    await page.locator('textarea').fill(longContent);
    
    // 文字数オーバーの表示を確認
    await expect(page.locator('text=文字数が上限を超えています')).toBeVisible();
    await expect(page.locator('text=-1文字')).toBeVisible();
    
    // 更新ボタンが無効化されていることを確認
    await expect(page.locator('button:has-text("更新")')).toBeDisabled();
  });

  test('編集時に空の内容を送信しようとするとエラーが表示される', async ({ page }) => {
    // 編集ボタンをクリック
    await page.locator('[data-testid="EditIcon"]').first().click();
    
    // 内容をクリア
    await page.locator('textarea').fill('');
    
    // 更新ボタンが無効化されていることを確認
    await expect(page.locator('button:has-text("更新")')).toBeDisabled();
  });

  test('編集中は更新ボタンが無効化される', async ({ page }) => {
    // 編集ボタンをクリック
    await page.locator('[data-testid="EditIcon"]').first().click();
    
    // APIレスポンスを遅延させるためのインターセプト
    await page.route('**/api/posts/1', async (route) => {
      if (route.request().method() === 'PUT') {
        await new Promise(resolve => setTimeout(resolve, 1000));
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            ...mockPosts[0],
            content: '更新された内容',
            updatedAt: new Date().toISOString(),
          }),
        });
      }
    });
    
    // 内容を編集
    await page.locator('textarea').fill('更新された内容');
    
    // 更新ボタンをクリック
    const updateButton = page.locator('button:has-text("更新")');
    await updateButton.click();
    
    // ボタンが「更新中...」に変わることを確認
    await expect(updateButton).toHaveText('更新中...');
    await expect(updateButton).toBeDisabled();
    
    // キャンセルボタンも無効化されることを確認
    await expect(page.locator('button:has-text("キャンセル")')).toBeDisabled();
  });

  test('編集の失敗時にエラーメッセージが表示される', async ({ page }) => {
    // 編集ボタンをクリック
    await page.locator('[data-testid="EditIcon"]').first().click();
    
    // エラーレスポンスを返すようにインターセプト
    await page.route('**/api/posts/1', async (route) => {
      if (route.request().method() === 'PUT') {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: '投稿の更新に失敗しました' }),
        });
      }
    });
    
    // 内容を編集
    await page.locator('textarea').fill('更新される内容');
    
    // 更新ボタンをクリック
    await page.locator('button:has-text("更新")').click();
    
    // エラーメッセージが表示されることを確認
    await expect(page.locator('text=投稿に失敗しました。もう一度お試しください。')).toBeVisible();
  });

  test('存在しない投稿を編集しようとした場合404エラーが返される', async ({ page }) => {
    // 編集ボタンをクリック
    await page.locator('[data-testid="EditIcon"]').first().click();
    
    // 404エラーレスポンスを返すようにインターセプト
    await page.route('**/api/posts/1', async (route) => {
      if (route.request().method() === 'PUT') {
        await route.fulfill({
          status: 404,
          contentType: 'application/json',
          body: JSON.stringify({ error: '投稿が見つかりません' }),
        });
      }
    });
    
    // 内容を編集
    await page.locator('textarea').fill('更新される内容');
    
    // 更新ボタンをクリック
    await page.locator('button:has-text("更新")').click();
    
    // エラーメッセージが表示されることを確認
    await expect(page.locator('text=投稿に失敗しました。もう一度お試しください。')).toBeVisible();
  });

  test('複数の投稿がある場合、正しい投稿が編集される', async ({ page }) => {
    // 2番目の投稿の編集ボタンをクリック
    await page.locator('[data-testid="EditIcon"]').nth(1).click();
    
    // 2番目の投稿内容が表示されることを確認
    await expect(page.locator('textarea')).toHaveValue('2番目の投稿');
    
    // 編集APIのインターセプト（2番目の投稿用）
    await page.route('**/api/posts/2', async (route) => {
      if (route.request().method() === 'PUT') {
        const body = route.request().postDataJSON();
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            ...mockPosts[1],
            content: body.content,
            updatedAt: new Date().toISOString(),
          }),
        });
      }
    });
    
    // 内容を編集
    await page.locator('textarea').fill('2番目の投稿を編集');
    
    // 更新ボタンをクリック
    await page.locator('button:has-text("更新")').click();
    
    // 編集モードが解除されることを確認
    await expect(page.locator('h6')).toHaveText('新しい投稿を作成');
  });
});