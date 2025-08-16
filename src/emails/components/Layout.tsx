import * as React from 'react';
import {
  Body,
  Container,
  Head,
  Html,
  Preview,
  Section,
  Tailwind,
} from '@react-email/components';

interface LayoutProps {
  preview: string;
  children: React.ReactNode;
}

export function Layout({ preview, children }: LayoutProps) {
  return (
    <Html>
      <Head />
      <Preview>{preview}</Preview>
      <Tailwind>
        <Body className="bg-gray-100 font-sans">
          <Container className="mx-auto py-8 px-4">
            <Section className="bg-white rounded-lg shadow-lg p-8 max-w-2xl mx-auto">
              {children}
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}