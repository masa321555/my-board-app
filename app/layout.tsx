import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import ThemeRegistry from './ThemeRegistry';
import SafeProviders from '@/components/SafeProviders';
import Header from '@/components/Header';
import SafeLayout from './SafeLayout';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "掲示板 - My Board App",
  description: "会員制掲示板アプリケーション",
  icons: {
    icon: [
      {
        url: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" fill="%231976d2"/><text x="16" y="22" font-family="Arial, sans-serif" font-size="20" fill="white" text-anchor="middle">B</text></svg>',
        type: 'image/svg+xml',
      }
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning
      >
        <ThemeRegistry>
          <SafeProviders>
            <SafeLayout>
              <Header />
              {children}
            </SafeLayout>
          </SafeProviders>
        </ThemeRegistry>
      </body>
    </html>
  );
}
