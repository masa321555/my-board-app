import CredentialsProvider from 'next-auth/providers/credentials';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';

async function getUser(email: string): Promise<any | undefined> {
  try {
    await dbConnect();
    // メール確認を無効化して、すべてのユーザーがログインできるようにする
    const user = await User.findOne({ email }).select('+password');
    return user;
  } catch (error) {
    console.error('Failed to fetch user:', error);
    throw new Error('Failed to fetch user.');
  }
}

export const authOptions: any = {
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: 'jwt',
  },
  pages: {
    signIn: '/auth/signin',
    signOut: '/auth/signout',
    error: '/auth/error',
    // メール確認ページへのリダイレクトを無効化
    // verifyRequest: '/auth/verify-email',
  },
  providers: [
    CredentialsProvider({
      credentials: {
        email: { label: 'メールアドレス', type: 'email' },
        password: { label: 'パスワード', type: 'password' },
      },
      async authorize(credentials) {
        const parsedCredentials = z
          .object({ email: z.string().email(), password: z.string().min(6) })
          .safeParse(credentials);

        if (parsedCredentials.success) {
          const { email, password } = parsedCredentials.data;
          const user = await getUser(email);
          if (!user) return null;
          
          // bcrypt.compareを使用してパスワードを検証
          const passwordsMatch = await bcrypt.compare(password, user.password);
          if (passwordsMatch) {
            return {
              id: user._id ? user._id.toString() : user.id || '',
              email: user.email,
              name: user.name,
              role: user.role,
              emailVerified: true, // メール確認を強制的にtrueにする
            };
          }
        }

        console.log('Invalid credentials');
        return null;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }: any) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.emailVerified = !!user.emailVerified;
      }
      return token;
    },
    async session({ session, token }: any) {
      if (session?.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.emailVerified = (token.emailVerified as boolean) ?? true;
      }
      return session;
    },
    async redirect({ url, baseUrl }: any) {
      // ログイン後にダッシュボードにリダイレクト
      if (url.startsWith('/auth/signin') || url.startsWith('/auth/verify-email')) {
        return `${baseUrl}/dashboard`;
      }
      return url;
    },
  },
};