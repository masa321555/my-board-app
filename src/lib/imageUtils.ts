import sharp from 'sharp';

export interface ImageProcessOptions {
  width?: number;
  height?: number;
  quality?: number;
  format?: 'jpeg' | 'png' | 'webp';
}

export async function processImage(
  buffer: Buffer,
  options: ImageProcessOptions = {}
): Promise<Buffer> {
  const {
    width = 400,
    height = 400,
    quality = 85,
    format = 'jpeg',
  } = options;

  try {
    // 画像をリサイズし、正方形にクロップ
    const processedImage = await sharp(buffer)
      .resize(width, height, {
        fit: 'cover',
        position: 'center',
      })
      .toFormat(format, { quality })
      .toBuffer();

    return processedImage;
  } catch (error) {
    console.error('Image processing error:', error);
    throw new Error('画像の処理に失敗しました');
  }
}

export async function getImageMetadata(buffer: Buffer) {
  try {
    const metadata = await sharp(buffer).metadata();
    return {
      width: metadata.width,
      height: metadata.height,
      format: metadata.format,
      size: buffer.length,
    };
  } catch (error) {
    console.error('Failed to get image metadata:', error);
    throw new Error('画像情報の取得に失敗しました');
  }
}