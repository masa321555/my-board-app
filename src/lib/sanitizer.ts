import DOMPurify from 'dompurify';
import { JSDOM } from 'jsdom';

// サーバーサイドでDOMPurifyを使用するための設定
const window = new JSDOM('').window;
const purify = DOMPurify(window as any);

// サニタイゼーション設定
const SANITIZE_CONFIG = {
  // 許可するHTMLタグ
  ALLOWED_TAGS: [
    'p', 'br', 'span', 'div',
    'strong', 'em', 'u', 's', 'mark',
    'a', 'img',
    'ul', 'ol', 'li',
    'blockquote', 'code', 'pre',
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'table', 'thead', 'tbody', 'tr', 'th', 'td',
  ],
  
  // 許可する属性
  ALLOWED_ATTR: [
    'href', 'target', 'rel', 'title',
    'src', 'alt', 'width', 'height',
    'class', 'id',
    'colspan', 'rowspan',
  ],
  
  // データ属性を許可しない
  ALLOW_DATA_ATTR: false,
  
  // ARIAを許可
  ALLOW_ARIA_ATTR: true,
  
  // 不明なプロトコルを許可しない
  ALLOW_UNKNOWN_PROTOCOLS: false,
  
  // 許可するURIスキーム
  ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|cid|xmpp):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
};

// 基本的なサニタイゼーション
export function sanitizeHtml(dirty: string): string {
  return purify.sanitize(dirty, SANITIZE_CONFIG);
}

// 厳格なサニタイゼーション（プレーンテキストのみ）
export function sanitizeText(dirty: string): string {
  return purify.sanitize(dirty, { ALLOWED_TAGS: [] });
}

// Markdown用のサニタイゼーション
export function sanitizeMarkdown(dirty: string): string {
  const markdownConfig = {
    ...SANITIZE_CONFIG,
    ALLOWED_TAGS: [
      ...SANITIZE_CONFIG.ALLOWED_TAGS,
      'hr', 'br',
    ],
  };
  return purify.sanitize(dirty, markdownConfig);
}

// URLのサニタイゼーション
export function sanitizeUrl(url: string): string {
  try {
    const parsed = new URL(url);
    // HTTPSまたはHTTPのみ許可
    if (!['https:', 'http:'].includes(parsed.protocol)) {
      return '';
    }
    return parsed.toString();
  } catch {
    return '';
  }
}

// メールアドレスの検証とサニタイゼーション
export function sanitizeEmail(email: string): string {
  const trimmed = email.trim().toLowerCase();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  if (!emailRegex.test(trimmed)) {
    throw new Error('無効なメールアドレス形式です');
  }
  
  return trimmed;
}

// ユーザー名のサニタイゼーション
export function sanitizeUsername(username: string): string {
  // 空白を削除
  const trimmed = username.trim();
  
  // 長さチェック
  if (trimmed.length < 1 || trimmed.length > 50) {
    throw new Error('ユーザー名は1〜50文字で入力してください');
  }
  
  // 特殊文字を削除（英数字、ひらがな、カタカナ、漢字、一部記号のみ許可）
  const cleaned = trimmed.replace(/[^\w\u3040-\u309f\u30a0-\u30ff\u4e00-\u9faf\u3400-\u4dbf\s\-_.]/g, '');
  
  if (cleaned !== trimmed) {
    throw new Error('ユーザー名に使用できない文字が含まれています');
  }
  
  return cleaned;
}

// 投稿タイトルのサニタイゼーション
export function sanitizePostTitle(title: string): string {
  const trimmed = title.trim();
  
  if (trimmed.length < 1 || trimmed.length > 100) {
    throw new Error('タイトルは1〜100文字で入力してください');
  }
  
  // HTMLタグを完全に削除
  return sanitizeText(trimmed);
}

// 投稿本文のサニタイゼーション
export function sanitizePostContent(content: string): string {
  const trimmed = content.trim();
  
  if (trimmed.length < 1 || trimmed.length > 1000) {
    throw new Error('本文は1〜1000文字で入力してください');
  }
  
  // 基本的なHTMLタグは許可
  return sanitizeHtml(trimmed);
}

// ファイル名のサニタイゼーション
export function sanitizeFilename(filename: string): string {
  // パスセパレータを削除
  let cleaned = filename.replace(/[\/\\]/g, '');
  
  // 危険な文字を削除
  cleaned = cleaned.replace(/[^\w\u3040-\u309f\u30a0-\u30ff\u4e00-\u9faf\u3400-\u4dbf\s\-_.]/g, '');
  
  // 先頭と末尾のドットを削除
  cleaned = cleaned.replace(/^\.+|\.+$/g, '');
  
  // 長さ制限
  if (cleaned.length > 255) {
    const ext = cleaned.split('.').pop() || '';
    const name = cleaned.substring(0, 250 - ext.length - 1);
    cleaned = ext ? `${name}.${ext}` : name;
  }
  
  return cleaned || 'unnamed';
}

// SQLインジェクション対策（エスケープ）
export function escapeSql(value: string): string {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "\\'")
    .replace(/"/g, '\\"')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')
    .replace(/\x00/g, '\\x00')
    .replace(/\x1a/g, '\\x1a');
}

// XSS対策用のHTMLエスケープ
export function escapeHtml(str: string): string {
  const div = window.document.createElement('div');
  div.appendChild(window.document.createTextNode(str));
  return div.innerHTML;
}

// 一括サニタイゼーション
export interface SanitizeOptions {
  html?: boolean;
  markdown?: boolean;
  plainText?: boolean;
  trim?: boolean;
  lowercase?: boolean;
  maxLength?: number;
}

export function sanitize(value: any, options: SanitizeOptions = {}): string {
  // null/undefinedの場合は空文字を返す
  if (value == null) return '';
  
  // 文字列に変換
  let str = String(value);
  
  // トリム
  if (options.trim !== false) {
    str = str.trim();
  }
  
  // 小文字変換
  if (options.lowercase) {
    str = str.toLowerCase();
  }
  
  // 長さ制限
  if (options.maxLength && str.length > options.maxLength) {
    str = str.substring(0, options.maxLength);
  }
  
  // サニタイゼーション
  if (options.plainText) {
    str = sanitizeText(str);
  } else if (options.markdown) {
    str = sanitizeMarkdown(str);
  } else if (options.html !== false) {
    str = sanitizeHtml(str);
  }
  
  return str;
}