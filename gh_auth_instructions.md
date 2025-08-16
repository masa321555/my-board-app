# GitHub CLI 認証手順

GitHub CLIがインストールされました。プルリクエストを作成するには認証が必要です。

## 認証手順

1. ターミナルで以下のコマンドを実行:
   ```bash
   gh auth login
   ```

2. 以下の選択肢が表示されます:
   - "GitHub.com" を選択
   - "HTTPS" を選択
   - "Y" (GitHubの認証情報を使用)
   - "Login with a web browser" を選択

3. ブラウザが開き、認証コードが表示されます
4. GitHubにログインして認証を完了

## 認証後のプルリクエスト作成

認証が完了したら、以下のコマンドでプルリクエストを作成できます:

```bash
gh pr create --title "feat: 会員認証機能の実装" --body-file PR_TEMPLATE.md --base develop
```

または、インタラクティブモードで作成:

```bash
gh pr create
```

このコマンドで以下を設定できます:
- タイトル: feat: 会員認証機能の実装
- Base branch: develop
- 本文: PR_TEMPLATE.mdの内容をコピー&ペースト