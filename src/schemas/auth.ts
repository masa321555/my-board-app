import { z } from 'zod';
import { checkPasswordStrength } from '@/utils/passwordStrength';

// 登録フォームのスキーマ
export const registerSchema = z.object({
  name: z
    .string()
    .min(1, '名前を入力してください')
    .max(50, '名前は50文字以内で入力してください'),
  email: z
    .string()
    .min(1, 'メールアドレスを入力してください')
    .email('有効なメールアドレスを入力してください')
    .toLowerCase(),
  password: z
    .string()
    .min(8, 'パスワードは8文字以上で入力してください')
    .max(100, 'パスワードは100文字以内で入力してください')
    .refine((password) => {
      // 開発環境ではパスワード強度チェックを緩和
      const isDevelopment = process.env.NODE_ENV === 'development';
      if (isDevelopment) {
        return password.length >= 8; // 開発環境では8文字以上のみチェック
      }
      const strength = checkPasswordStrength(password);
      return strength.isStrong;
    }, 'パスワードが弱すぎます。8文字以上で、より強力なパスワードを設定してください'),
  confirmPassword: z
    .string()
    .min(1, 'パスワード（確認）を入力してください')
    .optional(), // 開発環境ではオプショナルに
}).refine((data) => {
  // 開発環境ではパスワード確認をスキップ
  const isDevelopment = process.env.NODE_ENV === 'development';
  if (isDevelopment) {
    return true;
  }
  return data.password === data.confirmPassword;
}, {
  message: 'パスワードが一致しません',
  path: ['confirmPassword'],
});

export type RegisterFormData = z.infer<typeof registerSchema>;

// ログインフォームのスキーマ
export const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'メールアドレスを入力してください')
    .email('有効なメールアドレスを入力してください')
    .toLowerCase(),
  password: z
    .string()
    .min(1, 'パスワードを入力してください'),
});

export type LoginFormData = z.infer<typeof loginSchema>;