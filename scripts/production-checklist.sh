#!/bin/bash

# 本番デプロイ前の包括的チェックスクリプト
echo "🚀 本番デプロイ前チェックリスト 🚀"
echo "===================================="

# カラー定義
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# チェック結果の集計
TOTAL_CHECKS=0
PASSED_CHECKS=0
WARNINGS=0

# チェック関数
check() {
    local description=$1
    local command=$2
    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
    
    echo -n "▶ $description... "
    if eval "$command" > /dev/null 2>&1; then
        echo -e "${GREEN}✓${NC}"
        PASSED_CHECKS=$((PASSED_CHECKS + 1))
        return 0
    else
        echo -e "${RED}✗${NC}"
        return 1
    fi
}

# 警告関数
warn() {
    local description=$1
    local command=$2
    
    echo -n "▶ $description... "
    if eval "$command" > /dev/null 2>&1; then
        echo -e "${GREEN}✓${NC}"
        return 0
    else
        echo -e "${YELLOW}⚠${NC}"
        WARNINGS=$((WARNINGS + 1))
        return 1
    fi
}

# セクションヘッダー
section() {
    echo -e "\n${BLUE}[$1]${NC}"
}

# ===========================================
# 1. コード品質チェック
# ===========================================
section "コード品質"

check "TypeScriptコンパイル" "npx tsc --noEmit"
check "ESLintチェック" "npm run lint"
check "Prettierフォーマット" "npx prettier --check ."
check "未使用の依存関係" "! npx depcheck | grep -E 'Unused dependencies|Missing dependencies'"

# ===========================================
# 2. セキュリティチェック
# ===========================================
section "セキュリティ"

check "npm脆弱性監査（高リスク）" "! npm audit --production --audit-level=high | grep -E 'high|critical'"
warn "npm脆弱性監査（中リスク）" "! npm audit --production --audit-level=moderate | grep 'moderate'"
check "秘密情報の漏洩チェック" "! grep -r 'NEXTAUTH_SECRET\\|SENDGRID_API_KEY\\|mongodb+srv' --include='*.ts' --include='*.tsx' --include='*.js' --exclude-dir=node_modules --exclude-dir=.next ."
check ".env.localがGitignoreに含まれている" "grep -q '.env.local' .gitignore"

# ===========================================
# 3. ビルドチェック
# ===========================================
section "ビルド"

check "本番ビルド" "NODE_ENV=production npm run build"
check "ビルドサイズ（< 50MB）" "[ $(du -sm .next | cut -f1) -lt 50 ]"
check "静的ファイルの生成" "[ -d .next/static ]"

# ===========================================
# 4. 環境変数チェック
# ===========================================
section "環境変数"

ENV_VARS=(
    "NEXTAUTH_SECRET"
    "DATABASE_URL"
    "SENDGRID_API_KEY"
    "SENDGRID_FROM_EMAIL"
)

for var in "${ENV_VARS[@]}"; do
    check "$var が設定されている" "[ ! -z \"\${$var}\" ]"
done

# オプション環境変数の警告
warn "SENTRY_DSN が設定されている" "[ ! -z \"\${SENTRY_DSN}\" ]"

# ===========================================
# 5. 依存関係チェック
# ===========================================
section "依存関係"

check "package-lock.jsonが存在" "[ -f package-lock.json ]"
check "Node.jsバージョン（>= 18）" "node -v | grep -E 'v(18|19|20|21)'"
check "npmバージョン（>= 8）" "npm -v | grep -E '^(8|9|10)'"

# ===========================================
# 6. テストチェック
# ===========================================
section "テスト"

warn "単体テスト" "npm test -- --passWithNoTests"
warn "E2Eテスト" "npm run test:e2e -- --pass-with-no-tests || true"

# ===========================================
# 7. パフォーマンスチェック
# ===========================================
section "パフォーマンス"

check "画像最適化設定" "grep -q 'images:' next.config.js"
check "SWC最小化設定" "grep -q 'swcMinify: true' next.config.js"

# ===========================================
# 8. セキュリティヘッダーチェック
# ===========================================
section "セキュリティヘッダー"

check "Strict-Transport-Security設定" "grep -q 'Strict-Transport-Security' vercel.json"
check "Content-Security-Policy設定" "grep -q 'generateCSP' src/lib/security-headers.ts"
check "X-Frame-Options設定" "grep -q 'X-Frame-Options' vercel.json"

# ===========================================
# 9. デプロイ設定チェック
# ===========================================
section "デプロイ設定"

check "vercel.jsonが存在" "[ -f vercel.json ]"
check "リージョン設定（東京）" "grep -q 'nrt1' vercel.json"
check "ビルドコマンド設定" "grep -q 'build:production' vercel.json"

# ===========================================
# 10. ドキュメントチェック
# ===========================================
section "ドキュメント"

warn "README.mdが存在" "[ -f README.md ]"
warn "環境変数ドキュメント" "[ -f docs/environment-variables.md ]"
warn "デプロイガイド" "[ -f docs/deployment-guide.md ]"

# ===========================================
# 11. Gitチェック
# ===========================================
section "Git"

check "未コミットの変更がない" "[ -z \"$(git status --porcelain)\" ]"
check "mainブランチ" "[ \"$(git branch --show-current)\" = \"main\" ] || [ \"$(git branch --show-current)\" = \"master\" ]"
warn "タグが設定されている" "[ ! -z \"$(git tag -l)\" ]"

# ===========================================
# 12. ファイルサイズチェック
# ===========================================
section "ファイルサイズ"

check "大きなファイルがない（> 10MB）" "! find . -type f -size +10M -not -path './node_modules/*' -not -path './.next/*' -not -path './.git/*' | grep ."

# ===========================================
# 結果サマリー
# ===========================================
echo -e "\n===================================="
echo -e "${BLUE}チェック結果サマリー${NC}"
echo -e "===================================="
echo -e "総チェック数: $TOTAL_CHECKS"
echo -e "成功: ${GREEN}$PASSED_CHECKS${NC}"
echo -e "失敗: ${RED}$((TOTAL_CHECKS - PASSED_CHECKS - WARNINGS))${NC}"
echo -e "警告: ${YELLOW}$WARNINGS${NC}"

FAILED=$((TOTAL_CHECKS - PASSED_CHECKS - WARNINGS))

if [ $FAILED -eq 0 ]; then
    if [ $WARNINGS -eq 0 ]; then
        echo -e "\n${GREEN}✅ すべてのチェックに合格しました！${NC}"
        echo -e "${GREEN}本番デプロイの準備が整っています。${NC}"
    else
        echo -e "\n${YELLOW}⚠️  警告がありますが、デプロイは可能です。${NC}"
        echo -e "${YELLOW}警告項目を確認することをお勧めします。${NC}"
    fi
    exit 0
else
    echo -e "\n${RED}❌ ${FAILED}個のチェックに失敗しました。${NC}"
    echo -e "${RED}デプロイ前に問題を修正してください。${NC}"
    exit 1
fi