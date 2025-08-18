#!/bin/bash

echo "=== 登録APIテスト ==="
echo ""

# テスト用のメールアドレスを生成
TIMESTAMP=$(date +%s)
EMAIL="test${TIMESTAMP}@example.com"

echo "テストデータ:"
echo "  名前: テストユーザー"
echo "  メール: ${EMAIL}"
echo "  パスワード: TestPassword123!"
echo ""

# JSON形式でのテスト
echo "1. JSON形式での送信テスト:"
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "テストユーザー",
    "email": "'${EMAIL}'",
    "password": "TestPassword123!",
    "confirmPassword": "TestPassword123!"
  }' \
  -v

echo ""
echo ""

# FormData形式でのテスト
EMAIL2="test${TIMESTAMP}_form@example.com"
echo "2. FormData形式での送信テスト:"
echo "  メール: ${EMAIL2}"
curl -X POST http://localhost:3000/api/auth/register-formdata \
  -F "name=テストユーザー" \
  -F "email=${EMAIL2}" \
  -F "password=TestPassword123!" \
  -F "confirmPassword=TestPassword123!" \
  -v

echo ""
echo "=== テスト完了 ==="