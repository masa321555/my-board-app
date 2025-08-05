import { test, expect } from '@playwright/test';

test.describe('投稿削除フロー', () => {
  // テスト用の投稿データ
  const mockPosts = [
    {
      _id: '1',
      content: '削除される投稿',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      _id: '2',
      content: '残る投稿',
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

  test('投稿を削除できる', async ({ page }) => {
    // 削除ボタンをクリック
    await page.locator('[data-testid="DeleteIcon"]').first().click();
    
    // 削除確認ダイアログが表示されることを確認
    await expect(page.locator('text=投稿の削除')).toBeVisible();
    await expect(page.locator('text=この投稿を削除してもよろしいですか？この操作は取り消せません。')).toBeVisible();
    
    // 削除APIのインターセプト
    await page.route('**/api/posts/1', async (route) => {
      if (route.request().method() === 'DELETE') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ message: '投稿を削除しました' }),
        });
      }
    });
    
    // 削除後の投稿リストを返すようにインターセプト
    let deleteRequested = false;
    await page.route('**/api/posts', async (route) => {
      if (route.request().method() === 'GET' && deleteRequested) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([mockPosts[1]]), // 最初の投稿を除外
        });
      } else {
        await route.continue();
      }
    });
    
    // 削除ボタンをクリック
    await page.locator('button:has-text("削除")').click();
    deleteRequested = true;
    
    // ダイアログが閉じることを確認
    await expect(page.locator('text=投稿の削除')).not.toBeVisible();
    
    // 削除された投稿が表示されないことを確認
    await expect(page.locator('text=削除される投稿')).not.toBeVisible();
    
    // 残りの投稿は表示されることを確認
    await expect(page.locator('text=残る投稿')).toBeVisible();
  });

  test('削除をキャンセルできる', async ({ page }) => {
    // 削除ボタンをクリック
    await page.locator('[data-testid="DeleteIcon"]').first().click();
    
    // 削除確認ダイアログが表示されることを確認
    await expect(page.locator('text=投稿の削除')).toBeVisible();
    
    // キャンセルボタンをクリック
    await page.locator('button:has-text("キャンセル")').click();
    
    // ダイアログが閉じることを確認
    await expect(page.locator('text=投稿の削除')).not.toBeVisible();
    
    // 投稿がまだ表示されることを確認
    await expect(page.locator('text=削除される投稿')).toBeVisible();
    await expect(page.locator('text=残る投稿')).toBeVisible();
  });

  test('削除ダイアログの外側をクリックしても閉じる', async ({ page }) => {
    // 削除ボタンをクリック
    await page.locator('[data-testid="DeleteIcon"]').first().click();
    
    // 削除確認ダイアログが表示されることを確認
    await expect(page.locator('text=投稿の削除')).toBeVisible();
    
    // ダイアログの外側（背景）をクリック
    await page.locator('.MuiBackdrop-root').click({ force: true });
    
    // ダイアログが閉じることを確認
    await expect(page.locator('text=投稿の削除')).not.toBeVisible();
    
    // 投稿がまだ表示されることを確認
    await expect(page.locator('text=削除される投稿')).toBeVisible();
  });

  test('存在しない投稿を削除しようとした場合404エラーが返される', async ({ page }) => {
    // 削除ボタンをクリック
    await page.locator('[data-testid="DeleteIcon"]').first().click();
    
    // 404エラーレスポンスを返すようにインターセプト
    await page.route('**/api/posts/1', async (route) => {
      if (route.request().method() === 'DELETE') {
        await route.fulfill({
          status: 404,
          contentType: 'application/json',
          body: JSON.stringify({ error: '投稿が見つかりません' }),
        });
      }
    });
    
    // 削除ボタンをクリック
    await page.locator('button:has-text("削除")').click();
    
    // エラーメッセージが表示されることを確認
    await expect(page.locator('text=投稿の削除に失敗しました')).toBeVisible();
    
    // ダイアログが閉じることを確認
    await expect(page.locator('text=投稿の削除')).not.toBeVisible();
  });

  test('削除の失敗時にエラーメッセージが表示される', async ({ page }) => {
    // 削除ボタンをクリック
    await page.locator('[data-testid="DeleteIcon"]').first().click();
    
    // エラーレスポンスを返すようにインターセプト
    await page.route('**/api/posts/1', async (route) => {
      if (route.request().method() === 'DELETE') {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: '投稿の削除に失敗しました' }),
        });
      }
    });
    
    // 削除ボタンをクリック
    await page.locator('button:has-text("削除")').click();
    
    // エラーメッセージが表示されることを確認
    await expect(page.locator('text=投稿の削除に失敗しました')).toBeVisible();
    
    // ダイアログが閉じることを確認
    await expect(page.locator('text=投稿の削除')).not.toBeVisible();
    
    // 投稿がまだ表示されることを確認（削除されていない）
    await expect(page.locator('text=削除される投稿')).toBeVisible();
  });

  test('複数の投稿がある場合、正しい投稿が削除される', async ({ page }) => {
    // 2番目の投稿の削除ボタンをクリック
    await page.locator('[data-testid="DeleteIcon"]').nth(1).click();
    
    // 削除確認ダイアログが表示されることを確認
    await expect(page.locator('text=投稿の削除')).toBeVisible();
    
    // 削除APIのインターセプト（2番目の投稿用）
    await page.route('**/api/posts/2', async (route) => {
      if (route.request().method() === 'DELETE') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ message: '投稿を削除しました' }),
        });
      }
    });
    
    // 削除後の投稿リストを返すようにインターセプト
    let deleteRequested = false;
    await page.route('**/api/posts', async (route) => {
      if (route.request().method() === 'GET' && deleteRequested) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([mockPosts[0]]), // 2番目の投稿を除外
        });
      } else {
        await route.continue();
      }
    });
    
    // 削除ボタンをクリック
    await page.locator('button:has-text("削除")').click();
    deleteRequested = true;
    
    // ダイアログが閉じることを確認
    await expect(page.locator('text=投稿の削除')).not.toBeVisible();
    
    // 削除された投稿が表示されないことを確認
    await expect(page.locator('text=残る投稿')).not.toBeVisible();
    
    // 最初の投稿は表示されることを確認
    await expect(page.locator('text=削除される投稿')).toBeVisible();
  });

  test('すべての投稿を削除した場合、「まだ投稿がありません」が表示される', async ({ page }) => {
    // 最初の投稿を削除
    await page.locator('[data-testid="DeleteIcon"]').first().click();
    
    // 削除APIのインターセプト
    await page.route('**/api/posts/1', async (route) => {
      if (route.request().method() === 'DELETE') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ message: '投稿を削除しました' }),
        });
      }
    });
    
    // 1つの投稿だけ残った状態を返す
    let firstDeleteRequested = false;
    await page.route('**/api/posts', async (route) => {
      if (route.request().method() === 'GET') {
        if (!firstDeleteRequested) {
          await route.continue();
        } else {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify([mockPosts[1]]),
          });
        }
      } else {
        await route.continue();
      }
    });
    
    // 最初の削除を実行
    await page.locator('button:has-text("削除")').click();
    firstDeleteRequested = true;
    
    // ダイアログが閉じるのを待つ
    await expect(page.locator('text=投稿の削除')).not.toBeVisible();
    
    // 2番目の投稿を削除
    await page.locator('[data-testid="DeleteIcon"]').first().click();
    
    // 削除APIのインターセプト（2番目の投稿用）
    await page.route('**/api/posts/2', async (route) => {
      if (route.request().method() === 'DELETE') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ message: '投稿を削除しました' }),
        });
      }
    });
    
    // 空の投稿リストを返す
    let secondDeleteRequested = false;
    await page.route('**/api/posts', async (route) => {
      if (route.request().method() === 'GET' && secondDeleteRequested) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([]),
        });
      }
    });
    
    // 2番目の削除を実行
    await page.locator('button:has-text("削除")').click();
    secondDeleteRequested = true;
    
    // 「まだ投稿がありません」が表示されることを確認
    await expect(page.locator('text=まだ投稿がありません')).toBeVisible();
  });
});