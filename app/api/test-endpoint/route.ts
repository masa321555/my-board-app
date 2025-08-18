import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ 
    ok: true, 
    message: 'Test endpoint is working',
    timestamp: new Date().toISOString()
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    console.log('Test endpoint received:', body);
    
    return NextResponse.json({
      ok: true,
      message: 'Data received successfully',
      received: body,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Test endpoint error:', error);
    
    return NextResponse.json({
      ok: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}