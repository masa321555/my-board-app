import { handlers } from '@/auth';

// Next.js 15の非同期APIに対応
export async function GET(
  request: Request,
  { params }: { params: Promise<{ nextauth: string[] }> }
) {
  const { nextauth } = await params;
  // handlersのGETメソッドを呼び出す
  return handlers.GET(request, { params: { nextauth } });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ nextauth: string[] }> }
) {
  const { nextauth } = await params;
  // handlersのPOSTメソッドを呼び出す
  return handlers.POST(request, { params: { nextauth } });
}