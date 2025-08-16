#!/bin/bash

# Vercel Deploy Hook URLを設定してください
DEPLOY_HOOK_URL="YOUR_DEPLOY_HOOK_URL_HERE"

if [ "$DEPLOY_HOOK_URL" = "YOUR_DEPLOY_HOOK_URL_HERE" ]; then
    echo "エラー: Deploy Hook URLを設定してください"
    echo "VercelダッシュボードでDeploy Hookを作成し、URLをこのファイルに設定してください"
    exit 1
fi

echo "Vercelに強制デプロイをトリガーしています..."
curl -X POST "$DEPLOY_HOOK_URL"

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ デプロイがトリガーされました！"
    echo "Vercelダッシュボードでデプロイの進行状況を確認してください。"
else
    echo ""
    echo "❌ デプロイのトリガーに失敗しました。"
    echo "Deploy Hook URLを確認してください。"
fi