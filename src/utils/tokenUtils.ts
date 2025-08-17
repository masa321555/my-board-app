import crypto from 'crypto';
import jwt from 'jsonwebtoken';

interface TokenPayload {
  userId: string;
  email: string;
  type: 'email-confirmation' | 'password-reset';
}

export class TokenUtils {
  // メール確認用トークンの生成
  static generateEmailConfirmationToken(userId: string, email: string): string {
    const payload: TokenPayload = {
      userId,
      email,
      type: 'email-confirmation'
    };
    
    return jwt.sign(payload, process.env.JWT_SECRET!, {
      expiresIn: '24h'
    } as jwt.SignOptions);
  }
  
  // パスワードリセット用トークンの生成
  static generatePasswordResetToken(userId: string, email: string): string {
    const payload: TokenPayload = {
      userId,
      email,
      type: 'password-reset'
    };
    
    return jwt.sign(payload, process.env.JWT_SECRET!, {
      expiresIn: process.env.PASSWORD_RESET_TOKEN_EXPIRES_IN || '1h'
    } as jwt.SignOptions);
  }
  
  // トークンの検証
  static verifyToken(token: string): TokenPayload {
    try {
      return jwt.verify(token, process.env.JWT_SECRET!) as TokenPayload;
    } catch (error) {
      throw new Error('無効なトークンです');
    }
  }
  
  // ランダムな確認コードの生成（6桁）
  static generateVerificationCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }
  
  // セキュアなランダム文字列の生成
  static generateSecureToken(length: number = 32): string {
    return crypto.randomBytes(length).toString('hex');
  }
}