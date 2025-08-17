import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import dbConnect from '@/lib/db';
import User from '@/models/User.model';

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'メールアドレス', type: 'email' },
        password: { label: 'パスワード', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('メールアドレスとパスワードを入力してください');
        }

        try {
          await dbConnect();

          console.log('認証開始:', credentials.email);

          // パスワードフィールドを含めてユーザーを取得
          const user = await User.findOne({ email: credentials.email }).select('+password');

          if (!user) {
            console.log('ユーザーが見つかりません:', credentials.email);
            throw new Error('メールアドレスまたはパスワードが正しくありません');
          }

          console.log('ユーザーが見つかりました:', user.email, user.name);

          // パスワード検証
          let isPasswordValid = false;
          try {
            // 直接bcryptで比較
            const bcrypt = require('bcryptjs');
            console.log('パスワード検証開始');
            console.log('入力パスワード:', credentials.password);
            console.log('ハッシュパスワード:', user.password);
            isPasswordValid = await bcrypt.compare(credentials.password, user.password);
            console.log('パスワード検証結果:', isPasswordValid);
          } catch (compareError) {
            console.error('Password comparison error:', compareError);
            throw new Error('メールアドレスまたはパスワードが正しくありません');
          }

          if (!isPasswordValid) {
            console.log('パスワードが一致しません');
            throw new Error('メールアドレスまたはパスワードが正しくありません');
          }

          console.log('認証成功:', user.email);

          // セッションに含める情報を返す
          return {
            id: (user as any)._id.toString(),
            email: user.email,
            name: user.name,
            role: user.role,
            emailVerified: Boolean((user as any).emailVerified ?? false),
          };
        } catch (error) {
          console.error('Authorization error:', error);
          throw error;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.emailVerified = !!user.emailVerified;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.emailVerified = token.emailVerified as boolean;
      }
      return session;
    },
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30日
  },
  secret: process.env.NEXTAUTH_SECRET,
};