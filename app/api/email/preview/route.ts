import { NextRequest, NextResponse } from 'next/server';
import { render } from '@react-email/render';
import WelcomeEmail from '@/emails/templates/WelcomeEmail';
import VerificationEmail from '@/emails/templates/VerificationEmail';
import PasswordResetEmail from '@/emails/templates/PasswordResetEmail';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const template = searchParams.get('template');
  
  // 開発環境のみで使用可能
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json(
      { error: 'Preview is only available in development' },
      { status: 403 }
    );
  }

  let html: string;
  
  try {
    switch (template) {
      case 'welcome':
        html = await render(WelcomeEmail({
          name: '山田太郎',
          email: 'yamada@example.com',
          loginUrl: 'http://localhost:3000/auth/signin',
        }));
        break;
        
      case 'verification':
        html = await render(VerificationEmail({
          name: '山田太郎',
          verificationUrl: 'http://localhost:3000/auth/verify?token=example-token',
          expiresIn: '24時間',
        }));
        break;
        
      case 'password-reset':
        html = await render(PasswordResetEmail({
          name: '山田太郎',
          resetUrl: 'http://localhost:3000/auth/reset-password?token=example-token',
          expiresIn: '1時間',
          ipAddress: '192.168.1.1',
          userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
        }));
        break;
        
      default:
        return NextResponse.json(
          { error: 'Invalid template. Use ?template=welcome, verification, or password-reset' },
          { status: 400 }
        );
    }

    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html',
      },
    });
  } catch (error) {
    console.error('Email preview error:', error);
    return NextResponse.json(
      { error: 'Failed to render email template' },
      { status: 500 }
    );
  }
}