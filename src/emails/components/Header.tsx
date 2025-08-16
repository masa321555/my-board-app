import * as React from 'react';
import { Heading, Img, Section } from '@react-email/components';

interface HeaderProps {
  appName?: string;
  logoUrl?: string;
}

export function Header({ appName = '会員制掲示板', logoUrl }: HeaderProps) {
  return (
    <Section className="text-center mb-8">
      {logoUrl && (
        <Img
          src={logoUrl}
          width="150"
          height="50"
          alt={appName}
          className="mx-auto mb-4"
        />
      )}
      <Heading className="text-2xl font-bold text-gray-800 m-0">
        {appName}
      </Heading>
    </Section>
  );
}