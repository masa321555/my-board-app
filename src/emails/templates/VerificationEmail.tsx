import * as React from 'react';
import { Text, Section } from '@react-email/components';
import { Layout } from '../components/Layout';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { Button } from '../components/Button';

interface VerificationEmailProps {
  name: string;
  verificationUrl: string;
  expiresIn?: string;
}

export default function VerificationEmail({
  name,
  verificationUrl,
  expiresIn = '24時間',
}: VerificationEmailProps) {
  const preview = 'メールアドレスの確認をお願いします';

  return (
    <Layout preview={preview}>
      <Header />
      
      <Section>
        <Text className="text-lg font-semibold text-gray-800 mb-4">
          {name}様
        </Text>
        
        <Text className="text-gray-700 mb-4">
          会員制掲示板へのご登録ありがとうございます。
        </Text>
        
        <Text className="text-gray-700 mb-6">
          アカウントを有効化するために、以下のボタンをクリックしてメールアドレスの確認を行ってください。
        </Text>
        
        <Section className="text-center mb-6">
          <Button href={verificationUrl}>メールアドレスを確認する</Button>
        </Section>
        
        <Text className="text-sm text-gray-600 mb-4">
          ボタンが機能しない場合は、以下のURLをブラウザにコピー＆ペーストしてください：
        </Text>
        
        <Text className="text-xs text-gray-500 break-all bg-gray-50 p-3 rounded mb-6">
          {verificationUrl}
        </Text>
        
        <Section className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
          <Text className="text-sm text-yellow-800 m-0">
            <strong>ご注意:</strong> このリンクは{expiresIn}で有効期限が切れます。
            期限が切れた場合は、再度登録手続きを行ってください。
          </Text>
        </Section>
        
        <Text className="text-gray-700 mt-6">
          このメールに心当たりがない場合は、このメールを無視してください。
        </Text>
      </Section>
      
      <Footer />
    </Layout>
  );
}