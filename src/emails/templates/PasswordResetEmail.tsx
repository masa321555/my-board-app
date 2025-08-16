import * as React from 'react';
import { Text, Link, Section } from '@react-email/components';
import { Layout } from '../components/Layout';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { Button } from '../components/Button';

interface PasswordResetEmailProps {
  name: string;
  resetUrl: string;
  expiresIn?: string;
  ipAddress?: string;
  userAgent?: string;
}

export default function PasswordResetEmail({
  name,
  resetUrl,
  expiresIn = '1時間',
  ipAddress,
  userAgent,
}: PasswordResetEmailProps) {
  const preview = 'パスワードリセットのご案内';

  return (
    <Layout preview={preview}>
      <Header />
      
      <Section>
        <Text className="text-lg font-semibold text-gray-800 mb-4">
          {name}様
        </Text>
        
        <Text className="text-gray-700 mb-4">
          パスワードリセットのリクエストを受け付けました。
        </Text>
        
        <Text className="text-gray-700 mb-6">
          以下のボタンをクリックして、新しいパスワードを設定してください。
        </Text>
        
        <Section className="text-center mb-6">
          <Button href={resetUrl}>パスワードをリセット</Button>
        </Section>
        
        <Text className="text-sm text-gray-600 mb-4">
          ボタンが機能しない場合は、以下のURLをブラウザにコピー＆ペーストしてください：
        </Text>
        
        <Text className="text-xs text-gray-500 break-all bg-gray-50 p-3 rounded mb-6">
          {resetUrl}
        </Text>
        
        <Section className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
          <Text className="text-sm text-red-800 m-0">
            <strong>重要:</strong> このリンクは{expiresIn}で有効期限が切れます。
            パスワードリセットを行わない場合は、このメールを無視してください。
          </Text>
        </Section>
        
        {(ipAddress || userAgent) && (
          <Section className="bg-gray-50 p-4 rounded-md mb-6">
            <Text className="text-sm font-semibold text-gray-700 mb-2">
              リクエスト情報:
            </Text>
            {ipAddress && (
              <Text className="text-xs text-gray-600 m-0">
                IPアドレス: {ipAddress}
              </Text>
            )}
            {userAgent && (
              <Text className="text-xs text-gray-600 m-0 mt-1">
                ブラウザ: {userAgent}
              </Text>
            )}
          </Section>
        )}
        
        <Text className="text-gray-700">
          このパスワードリセットをリクエストしていない場合は、お客様のアカウントは安全です。
          ただし、不正なアクセスが疑われる場合は、すぐにサポートまでご連絡ください。
        </Text>
      </Section>
      
      <Footer />
    </Layout>
  );
}