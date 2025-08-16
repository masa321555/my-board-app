#!/bin/bash

# デプロイ前チェックスクリプト
echo "🚀 デプロイ前チェックを開始します..."
echo "===================================="

# カラー定義
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# エラーカウント
ERROR_COUNT=0

# 1. ビルドチェック
echo -e "\n${YELLOW}1. ビルドチェック${NC}"
if npm run build > /dev/null 2>&1; then
    echo -e "${GREEN}✅ ビルド成功${NC}"
else
    echo -e "${RED}❌ ビルドエラー${NC}"
    ERROR_COUNT=$((ERROR_COUNT + 1))
fi

# 2. TypeScriptチェック
echo -e "\n${YELLOW}2. TypeScriptチェック${NC}"
if npx tsc --noEmit; then
    echo -e "${GREEN}✅ TypeScriptエラーなし${NC}"
else
    echo -e "${RED}❌ TypeScriptエラーあり${NC}"
    ERROR_COUNT=$((ERROR_COUNT + 1))
fi

# 3. Lintチェック
echo -e "\n${YELLOW}3. Lintチェック${NC}"
if npm run lint > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Lintエラーなし${NC}"
else
    echo -e "${RED}❌ Lintエラーあり${NC}"
    ERROR_COUNT=$((ERROR_COUNT + 1))
fi

# 4. セキュリティ監査
echo -e "\n${YELLOW}4. セキュリティ監査${NC}"
AUDIT_RESULT=$(npm audit --production --audit-level=high 2>&1)
if echo "$AUDIT_RESULT" | grep -q "found 0 vulnerabilities"; then
    echo -e "${GREEN}✅ 高リスクの脆弱性なし${NC}"
else
    echo -e "${YELLOW}⚠️  脆弱性が見つかりました${NC}"
    npm audit --production
fi

# 5. 環境変数チェック
echo -e "\n${YELLOW}5. 環境変数チェック${NC}"
REQUIRED_VARS=(
    "NEXTAUTH_SECRET"
    "DATABASE_URL"
    "SENDGRID_API_KEY"
    "SENDGRID_FROM_EMAIL"
)

ENV_FILE=".env.local"
if [ -f "$ENV_FILE" ]; then
    for VAR in "${REQUIRED_VARS[@]}"; do
        if grep -q "^$VAR=" "$ENV_FILE"; then
            echo -e "${GREEN}✅ $VAR が設定されています${NC}"
        else
            echo -e "${RED}❌ $VAR が設定されていません${NC}"
            ERROR_COUNT=$((ERROR_COUNT + 1))
        fi
    done
else
    echo -e "${RED}❌ .env.localファイルが見つかりません${NC}"
    ERROR_COUNT=$((ERROR_COUNT + 1))
fi

# 6. console.logチェック
echo -e "\n${YELLOW}6. console.log チェック${NC}"
CONSOLE_COUNT=$(grep -r "console\.\(log\|error\|warn\|debug\)" --include="*.ts" --include="*.tsx" --exclude-dir=node_modules --exclude-dir=.next . | grep -v "// eslint-disable" | wc -l)
if [ "$CONSOLE_COUNT" -eq 0 ]; then
    echo -e "${GREEN}✅ console.logなし${NC}"
else
    echo -e "${YELLOW}⚠️  ${CONSOLE_COUNT}個のconsole文が見つかりました${NC}"
    echo "詳細を確認するには以下を実行:"
    echo "grep -r 'console\.' --include='*.ts' --include='*.tsx' --exclude-dir=node_modules --exclude-dir=.next ."
fi

# 7. TODOコメントチェック
echo -e "\n${YELLOW}7. TODOコメントチェック${NC}"
TODO_COUNT=$(grep -r "TODO\|FIXME\|XXX" --include="*.ts" --include="*.tsx" --exclude-dir=node_modules --exclude-dir=.next . | wc -l)
if [ "$TODO_COUNT" -eq 0 ]; then
    echo -e "${GREEN}✅ TODOコメントなし${NC}"
else
    echo -e "${YELLOW}⚠️  ${TODO_COUNT}個のTODOコメントが見つかりました${NC}"
fi

# 8. パッケージサイズチェック
echo -e "\n${YELLOW}8. ビルドサイズチェック${NC}"
if [ -d ".next" ]; then
    BUILD_SIZE=$(du -sh .next | cut -f1)
    echo "ビルドサイズ: $BUILD_SIZE"
fi

# 9. Gitステータスチェック
echo -e "\n${YELLOW}9. Gitステータスチェック${NC}"
if [ -z "$(git status --porcelain)" ]; then
    echo -e "${GREEN}✅ すべての変更がコミット済み${NC}"
else
    echo -e "${YELLOW}⚠️  コミットされていない変更があります${NC}"
    git status --short
fi

# 結果サマリー
echo -e "\n===================================="
if [ $ERROR_COUNT -eq 0 ]; then
    echo -e "${GREEN}✅ デプロイ準備完了！${NC}"
    echo -e "\n次のステップ:"
    echo "1. git push origin main"
    echo "2. Vercelダッシュボードでデプロイを確認"
else
    echo -e "${RED}❌ ${ERROR_COUNT}個のエラーが見つかりました${NC}"
    echo -e "\nデプロイ前にエラーを修正してください。"
    exit 1
fi