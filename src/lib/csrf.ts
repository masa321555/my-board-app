import { randomBytes } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

// CSRF トークンの設定
const CSRF_TOKEN_NAME = 'csrf-token';
const CSRF_HEADER_NAME = 'x-csrf-token';
const CSRF_TOKEN_LENGTH = 32;
const CSRF_TOKEN_MAX_AGE = 60 * 60 * 24; // 24時間

// CSRF トークンの生成
export function generateCSRFToken(): string {
  return randomBytes(CSRF_TOKEN_LENGTH).toString('hex');
}

// CSRF トークンの取得または生成
export async function getOrGenerateCSRFToken(): Promise<string> {
  const cookieStore = await cookies();
  const existingToken = cookieStore.get(CSRF_TOKEN_NAME);
  
  if (existingToken?.value) {
    return existingToken.value;
  }
  
  // 新しいトークンを生成
  const newToken = generateCSRFToken();
  
  // クッキーに保存
  cookieStore.set(CSRF_TOKEN_NAME, newToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: CSRF_TOKEN_MAX_AGE,
    path: '/',
  });
  
  return newToken;
}

// CSRF トークンの検証
export async function verifyCSRFToken(req: NextRequest): Promise<boolean> {
  // GETリクエストは検証不要
  if (req.method === 'GET' || req.method === 'HEAD' || req.method === 'OPTIONS') {
    return true;
  }
  
  const cookieStore = await cookies();
  const cookieToken = cookieStore.get(CSRF_TOKEN_NAME)?.value;
  
  if (!cookieToken) {
    return false;
  }
  
  // ヘッダーまたはボディからトークンを取得
  const headerToken = req.headers.get(CSRF_HEADER_NAME);
  const bodyToken = await getTokenFromBody(req);
  
  const requestToken = headerToken || bodyToken;
  
  if (!requestToken) {
    return false;
  }
  
  // タイミング攻撃を防ぐため、固定時間での比較
  return timingSafeEqual(cookieToken, requestToken);
}

// リクエストボディからトークンを取得
async function getTokenFromBody(req: NextRequest): Promise<string | null> {
  try {
    const contentType = req.headers.get('content-type');
    
    if (contentType?.includes('application/json')) {
      const body = await req.json();
      return body._csrf || body.csrfToken || null;
    }
    
    if (contentType?.includes('application/x-www-form-urlencoded')) {
      const text = await req.text();
      const params = new URLSearchParams(text);
      return params.get('_csrf') || params.get('csrfToken');
    }
    
    if (contentType?.includes('multipart/form-data')) {
      const formData = await req.formData();
      const token = formData.get('_csrf') || formData.get('csrfToken');
      return token ? String(token) : null;
    }
  } catch {
    // パースエラーは無視
  }
  
  return null;
}

// タイミング攻撃を防ぐための固定時間比較
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }
  
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  
  return result === 0;
}

// CSRF保護ミドルウェア
export async function csrfProtection(req: NextRequest): Promise<NextResponse | null> {
  const isValid = await verifyCSRFToken(req);
  
  if (!isValid) {
    return NextResponse.json(
      { error: 'CSRFトークンが無効です' },
      { status: 403 }
    );
  }
  
  return null;
}

// CSRFトークンをレスポンスに追加
export async function addCSRFToken(res: NextResponse): Promise<NextResponse> {
  const token = await getOrGenerateCSRFToken();
  res.headers.set('X-CSRF-Token', token);
  return res;
}

// クライアント用のCSRFトークン取得関数
export async function getCSRFTokenForClient(): Promise<string> {
  try {
    const response = await fetch('/api/csrf-token', {
      method: 'GET',
      credentials: 'same-origin',
    });
    
    if (!response.ok) {
      throw new Error('CSRFトークンの取得に失敗しました');
    }
    
    const data = await response.json();
    return data.token;
  } catch (error) {
    console.error('CSRF token fetch error:', error);
    throw error;
  }
}

// CSRFトークンを含むfetch関数
export async function fetchWithCSRF(url: string, options: RequestInit = {}): Promise<Response> {
  const token = await getCSRFTokenForClient();
  
  const headers = new Headers(options.headers);
  headers.set(CSRF_HEADER_NAME, token);
  
  return fetch(url, {
    ...options,
    headers,
    credentials: 'same-origin',
  });
}