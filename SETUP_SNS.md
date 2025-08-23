# SNS機能開発セットアップ手順

## npmキャッシュの権限問題の解決

以下のコマンドを実行してください：

```bash
sudo chown -R $(whoami) ~/.npm
```

または、npmキャッシュディレクトリを変更：

```bash
npm config set cache ~/.npm-cache --global
```

## 必要なパッケージのインストール

```bash
# リアルタイム通信用
npm install socket.io socket.io-client

# 開発用ツール
npm install --save-dev @faker-js/faker @artillery/core
```

## 環境変数の設定

`.env.local`に以下を追加：

```env
# Socket.io設定（オプション）
SOCKET_IO_PORT=3001

# 通知設定
NOTIFICATION_BATCH_SIZE=100
NOTIFICATION_RETRY_COUNT=3

# キャッシュ設定
CACHE_TTL_TIMELINE=300
CACHE_TTL_USER_PROFILE=600
```

## 開発サーバーの起動

```bash
npm run dev
```

## 動作確認

1. http://localhost:3000 にアクセス
2. ブランチが`feature/sns-functions`であることを確認
3. 既存機能が正常に動作することを確認