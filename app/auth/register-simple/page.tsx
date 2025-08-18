'use client';

export default function SimpleRegisterTestPage() {
  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
      <h1>シンプル登録ページ</h1>
      <p>以下のリンクからアクセスしてください：</p>
      <ul>
        <li>
          <a href="/auth/register-test">テストページ（JSON/FormData両方）</a>
        </li>
        <li>
          <a href="/auth/register/page-backup">エンコード版登録ページ</a>
        </li>
      </ul>
      
      <h2>推奨される回避策</h2>
      <ol>
        <li>ブラウザの拡張機能（特にパスワードマネージャー）を無効化</li>
        <li>シークレット/プライベートモードで試す</li>
        <li>別のブラウザ（Chrome/Firefox/Safari）を使用</li>
      </ol>
      
      <h2>現在の問題</h2>
      <p>
        ブラウザ拡張機能やセキュリティソフトウェアが、パスワードフィールドを
        <code>password: "実際の値"</code> から <code>passwordLength: 12</code> に
        変換しているため、サーバー側でパスワードを受け取れません。
      </p>
    </div>
  );
}