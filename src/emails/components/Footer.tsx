import * as React from 'react';
import { Hr, Link, Section, Text } from '@react-email/components';

interface FooterProps {
  appName?: string;
  appUrl?: string;
  supportEmail?: string;
}

export function Footer({
  appName = '会員制掲示板',
  appUrl = process.env.APP_URL || 'http://localhost:3000',
  supportEmail = process.env.EMAIL_REPLY_TO || 'support@example.com',
}: FooterProps) {
  return (
    <>
      <Hr className="border-gray-300 my-8" />
      <Section className="text-center">
        <Text className="text-sm text-gray-600 mb-2">
          このメールは {appName} から送信されました
        </Text>
        <Text className="text-sm text-gray-600 mb-4">
          ご不明な点がございましたら、
          <Link href={`mailto:${supportEmail}`} className="text-blue-600 underline">
            {supportEmail}
          </Link>
          {' '}までお問い合わせください
        </Text>
        <Text className="text-xs text-gray-500">
          © {new Date().getFullYear()} {appName}. All rights reserved.
        </Text>
        <Text className="text-xs text-gray-500 mt-2">
          <Link href={appUrl} className="text-blue-600 underline">
            {appUrl}
          </Link>
        </Text>
      </Section>
    </>
  );
}