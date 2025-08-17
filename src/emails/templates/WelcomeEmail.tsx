import * as React from 'react';
import { Text, Section } from '@react-email/components';
import { Layout } from '../components/Layout';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { Button } from '../components/Button';

interface WelcomeEmailProps {
  name: string;
  email: string;
  loginUrl?: string;
}

export default function WelcomeEmail({
  name,
  email,
  loginUrl = `${process.env.APP_URL}/auth/signin`,
}: WelcomeEmailProps) {
  const preview = `${name}様、会員制掲示板へようこそ！`;

  return (
    <Layout preview={preview}>
      <Header />
      
      <Section>
        <Text className="text-lg font-semibold text-gray-800 mb-4">
          {name}様、ようこそ！
        </Text>
        
        <Text className="text-gray-700 mb-4">
          会員制掲示板へのご登録ありがとうございます。
          アカウントが正常に作成されました。
        </Text>
        
        <Text className="text-gray-700 mb-6">
          登録情報:
        </Text>
        
        <Section className="bg-gray-50 p-4 rounded-md mb-6">
          <Text className="text-sm text-gray-600 m-0">
            <strong>お名前:</strong> {name}
          </Text>
          <Text className="text-sm text-gray-600 m-0 mt-2">
            <strong>メールアドレス:</strong> {email}
          </Text>
        </Section>
        
        <Text className="text-gray-700 mb-6">
          早速ログインして、掲示板での交流を始めましょう！
        </Text>
        
        <Section className="text-center mb-6">
          <Button href={loginUrl}>ログインする</Button>
        </Section>
        
        <Text className="text-gray-700">
          今後とも会員制掲示板をよろしくお願いいたします。
        </Text>
      </Section>
      
      <Footer />
    </Layout>
  );
}