#!/bin/bash

echo "========================================="
echo "SNS機能開発環境の確認"
echo "========================================="
echo ""

# 1. Gitブランチの確認
echo "1. 現在のGitブランチ:"
echo "------------------------"
git branch --show-current
echo ""

# 2. 最新のコミット確認
echo "2. 最新のコミット:"
echo "------------------------"
git log --oneline -5
echo ""

# 3. パッケージの確認
echo "3. 必要なパッケージの確認:"
echo "------------------------"
echo -n "React Query (@tanstack/react-query): "
if grep -q "@tanstack/react-query" package.json 2>/dev/null; then
    echo "✅ インストール済み"
else
    echo "❌ 未インストール"
fi

echo -n "Socket.io Client (socket.io-client): "
if grep -q "socket.io-client" package.json 2>/dev/null; then
    echo "✅ インストール済み"
else
    echo "❌ 未インストール"
fi

echo -n "Socket.io Server (socket.io): "
if grep -q '"socket.io"' package.json 2>/dev/null; then
    echo "✅ インストール済み"
else
    echo "❌ 未インストール"
fi
echo ""

# 4. 環境変数の確認
echo "4. 環境変数の確認:"
echo "------------------------"
if [ -f .env.local ]; then
    echo -n "Socket.io URL設定: "
    if grep -q "NEXT_PUBLIC_SOCKET_URL" .env.local; then
        echo "✅ 設定済み"
    else
        echo "❌ 未設定"
    fi
    
    echo -n "SNS機能の設定: "
    if grep -q "TIMELINE_PAGE_SIZE" .env.local; then
        echo "✅ 設定済み"
    else
        echo "❌ 未設定"
    fi
else
    echo "❌ .env.localファイルが見つかりません"
fi
echo ""

# 5. ファイル構造の確認
echo "5. SNS機能のファイル構造:"
echo "------------------------"
if [ -d "src/features/sns" ]; then
    echo "✅ SNS機能フォルダ構造:"
    tree src/features/sns -L 2 2>/dev/null || find src/features/sns -type d -maxdepth 2 | sort
else
    echo "❌ src/features/snsフォルダが見つかりません"
fi
echo ""

# 6. プロバイダー設定の確認
echo "6. プロバイダー設定:"
echo "------------------------"
if [ -f "src/providers/QueryProvider.tsx" ]; then
    echo "✅ QueryProvider.tsx"
else
    echo "❌ QueryProvider.tsx が見つかりません"
fi

if [ -f "src/providers/SocketProvider.tsx" ]; then
    echo "✅ SocketProvider.tsx"
else
    echo "❌ SocketProvider.tsx が見つかりません"
fi
echo ""

# 7. アプリケーション起動コマンド
echo "7. アプリケーション起動コマンド:"
echo "------------------------"
echo "開発サーバーの起動:"
echo "  npm run dev"
echo ""
echo "ビルドテスト:"
echo "  npm run build"
echo ""
echo "TypeScriptチェック:"
echo "  npm run type-check"
echo ""
echo "Lintチェック:"
echo "  npm run lint"
echo ""

# 8. 次のステップ
echo "========================================="
echo "次のステップ:"
echo "========================================="
echo ""
echo "1. パッケージが未インストールの場合:"
echo "   ./INSTALL_PACKAGES.sh"
echo ""
echo "2. 開発サーバーを起動:"
echo "   npm run dev"
echo ""
echo "3. ブラウザで確認:"
echo "   http://localhost:3000"
echo ""
echo "========================================="