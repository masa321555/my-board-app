# DMARCポリシーレベル

## 現在の設定（モニタリングモード）
```
v=DMARC1; p=none; rua=mailto:admin@myboard321.site
```

## 段階的な強化

### 1. レポート受信の追加（推奨）
```
v=DMARC1; p=none; rua=mailto:admin@myboard321.site
```
- 認証失敗のレポートを受信
- 問題の早期発見が可能

### 2. 隔離モード（中級）
```
v=DMARC1; p=quarantine; rua=mailto:admin@myboard321.site; pct=50
```
- 認証失敗時：50%を迷惑メールへ
- 段階的な導入が可能

### 3. 拒否モード（上級）
```
v=DMARC1; p=reject; rua=mailto:admin@myboard321.site
```
- 認証失敗時：メール拒否
- 最も厳格な設定

## ムームードメインでの変更方法

1. コントロールパネル → ムームーDNS
2. `_dmarc` のTXTレコードを編集
3. 値を更新して保存

## 推奨事項

現在の `p=none` で問題ありません。
- SPFが正しく設定済み
- なりすましは防げている
- メール配信に影響なし

将来的に必要になったら段階的に強化できます。