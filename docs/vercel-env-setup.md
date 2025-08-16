# Vercel環境変数の設定手順（画像付きガイド）

## 環境変数の設定方法

### 1. Vercelダッシュボードにアクセス

1. https://vercel.com にログイン
2. あなたのプロジェクトをクリック

### 2. 環境変数設定画面へ移動

1. 上部メニューの「Settings」をクリック
2. 左側メニューの「Environment Variables」をクリック

### 3. 環境変数を追加

以下の環境変数を1つずつ追加していきます：

#### 追加方法：
1. 「Key」欄に変数名を入力
2. 「Value」欄に値を入力
3. 「Environment」で「Production」「Preview」「Development」を全て選択
4. 「Add」ボタンをクリック

### 必要な環境変数一覧

#### 1. データベース接続
```
Key: MONGODB_URI
Value: [MongoDB Atlasの接続文字列]
例: mongodb+srv://username:password@cluster.mongodb.net/myboard?retryWrites=true&w=majority
```

#### 2. NextAuth認証
```
Key: NEXTAUTH_URL
Value: https://www.myboard321.site
```

```
Key: NEXTAUTH_SECRET
Value: [32文字以上のランダムな文字列]
生成方法: ターミナルで以下を実行
openssl rand -base64 32
```

#### 3. メール設定（以下から1つを選択）

**オプション1: Gmail を使う場合**
```
Key: EMAIL_PROVIDER
Value: gmail
```
```
Key: GMAIL_USER
Value: [あなたのGmailアドレス]
例: yourname@gmail.com
```
```
Key: GMAIL_APP_PASSWORD
Value: [Gmailアプリパスワード]
※ Gmailの2段階認証を有効にして、アプリパスワードを生成する必要があります
```

**オプション2: SMTP（Muumuu Mail等）を使う場合**
```
Key: EMAIL_PROVIDER
Value: smtp
```
```
Key: MAIL_HOST
Value: smtp.muumuu-mail.com
```
```
Key: MAIL_PORT
Value: 587
```
```
Key: MAIL_USER
Value: info@myboard321.site
```
```
Key: MAIL_PASS
Value: [SMTPパスワード]
```
```
Key: MAIL_SECURE
Value: false
```

#### 4. その他の設定
```
Key: EMAIL_FROM
Value: 会員制掲示板 <noreply@myboard321.site>
```
```
Key: SESSION_SECRET
Value: [32文字以上のランダムな文字列]
生成方法: openssl rand -base64 32
```
```
Key: EMAIL_RATE_LIMIT_PER_HOUR
Value: 100
```

### 4. 環境変数の確認

全ての環境変数を追加したら：
1. 画面に追加した環境変数のリストが表示されます
2. 値は●●●●で隠されていますが、これは正常です

### 5. デプロイを再実行

環境変数を設定した後：
1. 「Deployments」タブに移動
2. 最新のデプロイメントの「...」メニューをクリック
3. 「Redeploy」を選択
4. 「Use existing Build Cache」のチェックを外す
5. 「Redeploy」ボタンをクリック

## 環境変数の値の取得方法

### MongoDB URIの取得
1. MongoDB Atlasにログイン
2. クラスターの「Connect」ボタンをクリック
3. 「Connect your application」を選択
4. 接続文字列をコピー（パスワード部分を実際のパスワードに置き換える）

### シークレットキーの生成
ターミナルで以下のコマンドを実行：
```bash
# NEXTAUTH_SECRETの生成
openssl rand -base64 32

# SESSION_SECRETの生成
openssl rand -base64 32
```

### Gmailアプリパスワードの取得
1. Googleアカウント設定にアクセス
2. セキュリティ → 2段階認証プロセスを有効化
3. アプリパスワードを生成
4. 生成された16文字のパスワードをコピー

## トラブルシューティング

### ビルドエラーが発生する場合
- 環境変数名のスペルミスがないか確認
- 値の前後に不要なスペースがないか確認
- クォート（"）は不要です

### メール送信ができない場合
- EMAIL_PROVIDERの値が正しいか確認（gmail, yahoo, smtp のいずれか）
- 認証情報が正しいか確認
- Gmailの場合はアプリパスワードを使用しているか確認