import crypto from 'crypto';
import jwt from 'jsonwebtoken';

interface TokenPayload {
  userId: string;
  email: string;
  type: 'email-confirmation' | 'password-reset';
}

export class TokenUtils {
  // JWTシークレットの取得（JWT_SECRETまたはNEXTAUTH_SECRETを使用）
  private static getJwtSecret(): string {
    const secret = process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET;
    if (!secret) {
      throw new Error('JWT_SECRET or NEXTAUTH_SECRET must be defined');
    }
    return secret;
  }

  // メール確認用トークンの生成
  static generateEmailConfirmationToken(userId: string, email: string): string {
    const payload: TokenPayload = {
      userId,
      email,
      type: 'email-confirmation'
    };
    
    return jwt.sign(payload, this.getJwtSecret(), {
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
    
    return jwt.sign(payload, this.getJwtSecret(), {
      expiresIn: process.env.PASSWORD_RESET_TOKEN_EXPIRES_IN || '1h'
    } as jwt.SignOptions);
  }
  
  // トークンの検証
  static verifyToken(token: string): TokenPayload {
    try {
      return jwt.verify(token, this.getJwtSecret()) as TokenPayload;
    } catch (_error) {
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