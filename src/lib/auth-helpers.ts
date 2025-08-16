import { getServerSession } from 'next-auth/next';
import { authOptions } from './auth-options';
import { redirect } from 'next/navigation';

// セッション取得
export async function getSession() {
  return await getServerSession(authOptions);
}

// 認証必須ページ用
export async function requireAuth() {
  const session = await getSession();
  
  if (!session) {
    redirect('/auth/signin');
  }
  
  return session;
}

// 管理者権限チェック
export async function requireAdmin() {
  const session = await requireAuth();
  
  if (session.user.role !== 'admin') {
    redirect('/unauthorized');
  }
  
  return session;
}

// APIルート用認証チェック
export async function requireApiAuth() {
  const session = await getSession();
  
  if (!session) {
    throw new Error('Unauthorized');
  }
  
  return session;
}