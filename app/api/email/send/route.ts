import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/src/auth';
import { emailService } from '@/lib/email/service';
import { z } from 'zod';

// 送信リクエストのバリデーションスキーマ
const sendEmailSchema = z.object({
  type: z.enum(['welcome', 'verification', 'password-reset']),
  to: z.string().email(),
  data: z.record(z.string(), z.any()),
});

export async function POST(request: NextRequest) {
  try {
    // 認証チェック（管理者のみ送信可能にする場合）
    const session = await auth();
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    
    // バリデーション
    const validatedData = sendEmailSchema.parse(body);

    let result;
    
    // メールタイプに応じて送信
    switch (validatedData.type) {
      case 'welcome':
        result = await emailService.sendWelcomeEmail(
          validatedData.to,
          validatedData.data as { name: string; email: string }
        );
        break;
        
      case 'verification':
        result = await emailService.sendVerificationEmail(
          validatedData.to,
          validatedData.data as { name: string; verificationUrl: string }
        );
        break;
        
      case 'password-reset':
        result = await emailService.sendPasswordResetEmail(
          validatedData.to,
          validatedData.data as { 
            name: string; 
            resetUrl: string; 
            ipAddress?: string; 
            userAgent?: string;
          }
        );
        break;
        
      default:
        return NextResponse.json(
          { error: 'Invalid email type' },
          { status: 400 }
        );
    }

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      messageId: result.messageId,
    });
  } catch (error) {
    console.error('Email API error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to send email' },
      { status: 500 }
    );
  }
}