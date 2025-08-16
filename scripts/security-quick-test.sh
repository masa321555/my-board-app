#!/bin/bash

# セキュリティクイックテストスクリプト
# 基本的なセキュリティチェックを自動実行

echo "🔒 セキュリティクイックテスト開始 🔒"
echo "=================================="

# カラー定義
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# ベースURL
BASE_URL="${1:-http://localhost:3000}"

# 1. 依存関係の脆弱性チェック
echo -e "\n${YELLOW}1. 依存関係の脆弱性チェック${NC}"
npm audit --production
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ 脆弱性は見つかりませんでした${NC}"
else
    echo -e "${RED}❌ 脆弱性が見つかりました。'npm audit fix'を実行してください${NC}"
fi

# 2. セキュリティヘッダーのチェック
echo -e "\n${YELLOW}2. セキュリティヘッダーチェック${NC}"
HEADERS=$(curl -s -I "$BASE_URL")

check_header() {
    if echo "$HEADERS" | grep -qi "$1"; then
        echo -e "${GREEN}✅ $1${NC}"
    else
        echo -e "${RED}❌ $1 が見つかりません${NC}"
    fi
}

check_header "X-Frame-Options"
check_header "X-Content-Type-Options"
check_header "X-XSS-Protection"
check_header "Content-Security-Policy"
check_header "Referrer-Policy"

# 3. HTTPS設定のチェック（本番環境のみ）
if [[ "$BASE_URL" == https://* ]]; then
    echo -e "\n${YELLOW}3. HTTPS設定チェック${NC}"
    check_header "Strict-Transport-Security"
fi

# 4. レート制限のチェック
echo -e "\n${YELLOW}4. レート制限チェック${NC}"
echo "APIエンドポイントに6回連続リクエストを送信..."

# テスト用のカウンター
SUCCESS_COUNT=0
RATE_LIMITED=false

for i in {1..6}; do
    RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" -X GET "$BASE_URL/api/posts")
    if [ "$RESPONSE" -eq 429 ]; then
        RATE_LIMITED=true
        echo -e "${GREEN}✅ レート制限が機能しています（${i}回目でブロック）${NC}"
        break
    elif [ "$RESPONSE" -eq 200 ] || [ "$RESPONSE" -eq 401 ]; then
        SUCCESS_COUNT=$((SUCCESS_COUNT + 1))
    fi
done

if [ "$RATE_LIMITED" = false ]; then
    echo -e "${RED}❌ レート制限が機能していない可能性があります${NC}"
fi

# 5. ログディレクトリの確認
echo -e "\n${YELLOW}5. ログディレクトリチェック${NC}"
if [ -d "logs" ]; then
    echo -e "${GREEN}✅ logsディレクトリが存在します${NC}"
    
    # ログファイルのサイズチェック
    LOG_SIZE=$(du -sh logs 2>/dev/null | cut -f1)
    echo "   ログディレクトリサイズ: $LOG_SIZE"
    
    # 大きすぎる場合の警告
    if [ -n "$LOG_SIZE" ]; then
        SIZE_NUM=$(echo $LOG_SIZE | sed 's/[^0-9.]//g')
        SIZE_UNIT=$(echo $LOG_SIZE | sed 's/[0-9.]//g')
        
        if [[ "$SIZE_UNIT" == "G" ]] || ([[ "$SIZE_UNIT" == "M" ]] && (( $(echo "$SIZE_NUM > 500" | bc -l) ))); then
            echo -e "${YELLOW}   ⚠️  ログファイルが大きくなっています。クリーンアップを検討してください${NC}"
        fi
    fi
else
    echo -e "${RED}❌ logsディレクトリが存在しません${NC}"
fi

# 6. 環境変数のチェック
echo -e "\n${YELLOW}6. 環境変数チェック${NC}"
if [ -f ".env.local" ]; then
    echo -e "${GREEN}✅ .env.localファイルが存在します${NC}"
    
    # 必須環境変数のチェック
    REQUIRED_VARS=("DATABASE_URL" "NEXTAUTH_SECRET" "NEXTAUTH_URL")
    for VAR in "${REQUIRED_VARS[@]}"; do
        if grep -q "^$VAR=" .env.local; then
            echo -e "${GREEN}   ✅ $VAR が設定されています${NC}"
        else
            echo -e "${RED}   ❌ $VAR が設定されていません${NC}"
        fi
    done
else
    echo -e "${RED}❌ .env.localファイルが存在しません${NC}"
fi

# 7. MongoDBインデックスの確認（オプション）
echo -e "\n${YELLOW}7. データベース設定${NC}"
echo "   MongoDBのインデックスは手動で確認してください："
echo "   - auditlogsコレクションのTTLインデックス（90日）"
echo "   - postsコレクションのcreatedAtインデックス"
echo "   - usersコレクションのemailユニークインデックス"

# サマリー
echo -e "\n=================================="
echo -e "${YELLOW}テスト完了！${NC}"
echo -e "\n詳細なテストは以下を実行してください："
echo "  node scripts/test-security.js"
echo -e "\n手動テストガイド："
echo "  scripts/test-security-manual.md"