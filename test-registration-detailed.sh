#!/bin/bash

echo "=== 詳細な登録APIテスト ==="
echo ""

# テスト用のメールアドレスを生成
TIMESTAMP=$(date +%s)
EMAIL="test${TIMESTAMP}@example.com"

echo "テストデータ:"
echo "  名前: テストユーザー"
echo "  メール: ${EMAIL}"
echo "  パスワード: TestPassword123!"
echo ""

# JSON形式でのテスト（レスポンスを整形して表示）
echo "1. JSON形式での送信テスト:"
echo "リクエスト:"
echo '{
  "name": "テストユーザー",
  "email": "'${EMAIL}'",
  "password": "TestPassword123!",
  "confirmPassword": "TestPassword123!"
}'
echo ""
echo "レスポンス:"
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "テストユーザー",
    "email": "'${EMAIL}'",
    "password": "TestPassword123!",
    "confirmPassword": "TestPassword123!"
  }' \
  -s | python3 -m json.tool || echo "JSONパースエラー"

echo ""
echo "=== テスト完了 ==="