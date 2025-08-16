import { NextRequest, NextResponse } from 'next/server';
import { getOrGenerateCSRFToken } from '@/lib/csrf';

export async function GET(request: NextRequest) {
  try {
    const token = await getOrGenerateCSRFToken();
    
    return NextResponse.json(
      { token },
      {
        status: 200,
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate',
        },
      }
    );
  } catch (error) {
    console.error('CSRF token generation error:', error);
    return NextResponse.json(
      { error: 'CSRFトークンの生成に失敗しました' },
      { status: 500 }
    );
  }
}