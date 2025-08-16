#!/bin/bash

echo "=== DNS設定確認スクリプト ==="
echo ""
echo "ドメイン: myboard321.site"
echo "実行日時: $(date)"
echo ""

echo "1. SPFレコード確認:"
dig +short txt myboard321.site | grep spf
echo ""

echo "2. MXレコード確認:"
dig +short mx myboard321.site
echo ""

echo "3. Aレコード確認:"
dig +short a myboard321.site
echo ""

echo "4. DMARCレコード確認:"
dig +short txt _dmarc.myboard321.site
echo ""

echo "=== 確認完了 ==="