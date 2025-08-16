import { S3Client } from '@aws-sdk/client-s3';

// S3クライアントの設定
export const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'ap-northeast-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
});

export const S3_BUCKET_NAME = process.env.S3_BUCKET_NAME || '';

// 画像URLを生成する関数
export function getS3ImageUrl(key: string): string {
  const region = process.env.AWS_REGION || 'ap-northeast-1';
  return `https://${S3_BUCKET_NAME}.s3.${region}.amazonaws.com/${key}`;
}