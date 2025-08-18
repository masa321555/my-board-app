import { NextRequest } from 'next/server';
import bcrypt from 'bcryptjs';
import dbConnect from '@/lib/db';
import User from '@/models/User.model';
import { emailService } from '@/lib/email/service';
import { TokenUtils } from '@/utils/tokenUtils';
import { checkPasswordStrength } from '@/utils/passwordStrength';
import { normalizeUser } from '@/utils/dataTransform';
import { successResponse, errorResponse, standardErrors, checkRequiredEnvVars, missingEnvVarsResponse } from '@/utils/apiResponse';

// Edge Runtimeではnodemailer/bcryptjsが動作しないため、Node.js Runtimeを使用
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  // 必須環境変数チェック
  const envCheck = checkRequiredEnvVars(['MONGODB_URI', 'JWT_SECRET']);
  if (!envCheck.allPresent) {
    return missingEnvVarsResponse(envCheck.missing);
  }
  
  try {
    // FormDataの取得
    const formData = await request.formData();
    
    // FormDataから値を取得
    const name = formData.get('name') as string;
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const confirmPassword = formData.get('confirmPassword') as string;
    
    console.log('FormData受信:', {
      name,
      email,
      hasPassword: !!password,
      hasConfirmPassword: !!confirmPassword,
      passwordLength: password?.length,
      confirmPasswordLength: confirmPassword?.length,
    });
    
    // 必須フィールドチェック
    if (!name || !email || !password || !confirmPassword) {
      return errorResponse(
        '必須フィールドが不足しています',
        'MISSING_FIELDS',
        400,
        {
          receivedFields: {
            name: !!name,
            email: !!email,
            password: !!password,
            confirmPassword: !!confirmPassword,
          }
        }
      );
    }
    
    // バリデーション
    if (password !== confirmPassword) {
      return errorResponse('パスワードが一致しません', 'PASSWORD_MISMATCH', 400);
    }
    
    if (password.length < 8) {
      return errorResponse('パスワードは8文字以上で設定してください', 'PASSWORD_TOO_SHORT', 400);
    }
    
    // メールアドレスの簡易バリデーション
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return errorResponse('有効なメールアドレスを入力してください', 'INVALID_EMAIL', 400);
    }
    
    // MongoDB接続
    await dbConnect();
    
    // 既存ユーザーチェック
    const existingUser = await User.findOne({ email });
    
    if (existingUser) {
      return standardErrors.conflict('このメールアドレスは既に登録されています');
    }
    
    // パスワード強度チェック（本番環境のみ）
    if (!isDevelopment) {
      const passwordStrength = checkPasswordStrength(password);
      if (!passwordStrength.isStrong) {
        return errorResponse(
          'パスワードが弱すぎます',
          'WEAK_PASSWORD',
          400,
          {
            feedback: passwordStrength.feedback,
            suggestions: passwordStrength.suggestions,
          }
        );
      }
    }
    
    // パスワードをハッシュ化
    const hashedPassword = await bcrypt.hash(password, 12);
    
    // ユーザーを作成
    const user = await User.create({
      email,
      password: hashedPassword,
      name,
      emailVerified: isDevelopment ? true : false,
    });
    
    console.log('ユーザー作成成功:', user.email);
    
    // メール確認トークンを生成
    const confirmationToken = TokenUtils.generateEmailConfirmationToken(
      (user as any)._id.toString(),
      user.email
    );
    
    // 確認メールを送信
    let emailSent = false;
    try {
      const appUrl = process.env.APP_URL || 
        (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');
      const verificationUrl = `${appUrl}/api/auth/verify?token=${confirmationToken}`;
      
      const emailResult = await emailService.sendVerificationEmail(user.email, {
        name: user.name,
        verificationUrl,
      });
      emailSent = emailResult.success;
      
      if (isDevelopment && !emailSent) {
        console.log('開発環境: 確認URL:', verificationUrl);
      }
    } catch (emailError) {
      console.error('確認メール送信エラー:', emailError);
    }
    
    // ユーザーデータを正規化
    const normalizedUser = normalizeUser(user);
    if (!normalizedUser) {
      throw new Error('ユーザーデータの正規化に失敗しました');
    }
    
    const userData = {
      id: normalizedUser.id,
      email: normalizedUser.email,
    };
    
    const message = emailSent
      ? '登録が完了しました。確認メールをご確認ください。'
      : isDevelopment 
        ? '登録が完了しました。開発環境のため、メール確認は自動的に完了しています。'
        : '登録が完了しました。確認メールの送信に失敗しましたが、後ほど再送信できます。';
    
    return successResponse(
      { user: userData },
      message,
      emailSent ? 201 : 202,
      { emailSent }
    );
    
  } catch (error) {
    console.error('FormData登録エラー:', error);
    
    // MongoDBエラーの処理
    if (error && typeof error === 'object' && 'code' in error) {
      const mongoError = error as any;
      if (mongoError.code === 11000) {
        return standardErrors.conflict('このメールアドレスは既に登録されています');
      }
    }
    
    return errorResponse('ユーザー登録に失敗しました', 'REGISTRATION_FAILED', 500);
  }
}