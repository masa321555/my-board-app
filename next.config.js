const { withSentryConfig } = require('@sentry/nextjs');

/** @type {import('next').NextConfig} */
const nextConfig = {
  // 厳格モード
  reactStrictMode: true,
  
  // SWC最小化
  swcMinify: true,
  
  // 画像最適化
  images: {
    domains: [
      'localhost',
      process.env.NEXT_PUBLIC_APP_URL?.replace('https://', '') || '',
    ].filter(Boolean),
    formats: ['image/avif', 'image/webp'],
  },
  
  // 実験的機能
  experimental: {
    // サーバーアクションの有効化
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
  
  // セキュリティヘッダー（Vercel.jsonでも設定しているが念のため）
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
        ],
      },
    ];
  },
  
  // リダイレクト設定
  async redirects() {
    return [
      {
        source: '/dashboard',
        destination: '/board',
        permanent: true,
      },
    ];
  },
  
  // Webpack設定
  webpack: (config, { isServer }) => {
    // Sentryのソースマップアップロード設定
    if (!isServer) {
      config.resolve.alias = {
        ...config.resolve.alias,
        '@sentry/node': '@sentry/browser',
      };
    }
    
    return config;
  },
  
  // 環境変数の検証
  env: {
    NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME || 'Board App',
  },
  
  // 本番ビルドの最適化
  productionBrowserSourceMaps: false,
  
  // 静的ファイルの圧縮
  compress: true,
  
  // ビルド出力の設定
  distDir: '.next',
  
  // TypeScriptの設定
  typescript: {
    ignoreBuildErrors: false,
  },
  
  // ESLintの設定
  eslint: {
    ignoreDuringBuilds: false,
  },
};

// Sentry設定
const sentryWebpackPluginOptions = {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,
  silent: true,
  hideSourceMaps: true,
  disableLogger: true,
  
  // ソースマップのアップロード設定
  widenClientFileUpload: true,
  transpileClientSDK: true,
  tunnelRoute: '/monitoring',
  
  // リリース設定
  release: {
    deploy: {
      env: process.env.NODE_ENV,
    },
  },
};

// Sentryの設定をエクスポート（本番環境のみ）
module.exports = process.env.NODE_ENV === 'production' && process.env.SENTRY_DSN
  ? withSentryConfig(nextConfig, sentryWebpackPluginOptions)
  : nextConfig;