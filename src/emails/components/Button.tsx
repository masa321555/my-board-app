import * as React from 'react';
import { Button as EmailButton } from '@react-email/components';

interface ButtonProps {
  href: string;
  children: React.ReactNode;
}

export function Button({ href, children }: ButtonProps) {
  return (
    <EmailButton
      href={href}
      className="bg-blue-600 text-white font-semibold py-3 px-6 rounded-md text-center inline-block no-underline"
    >
      {children}
    </EmailButton>
  );
}