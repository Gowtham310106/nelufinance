// src/features/upload/upload.service.ts
import sharp from 'sharp';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import path from 'path';
import * as fs from 'fs';

/** Image types Sharp can decode with its prebuilt binaries. */
export const ALLOWED_IMAGE_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/avif',
  'image/tiff',
];
export const MAX_IMAGE_UPLOAD_BYTES = 10 * 1024 * 1024; // 10 MB per photo before compression

export interface UploadedImageResult {
  url: string;
  key: string;
  caption?: string;
  uploadedAt: Date;
}

export class UploadService {
  private s3Client: S3Client | null = null;
  private bucket: string = '';
  private publicUrl: string = '';
  private localUploadDir: string;

  constructor() {
    const endpoint = process.env.CLOUDFLARE_R2_ENDPOINT;
    const accessKeyId = process.env.CLOUDFLARE_R2_ACCESS_KEY_ID;
    const secretAccessKey = process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY;
    this.bucket = process.env.CLOUDFLARE_R2_BUCKET || '';
    this.publicUrl = process.env.CLOUDFLARE_R2_PUBLIC_URL || '';

    // If running in Vercel / serverless environment, fallback to /tmp
    const baseDir = process.env.VERCEL ? '/tmp' : process.cwd();
    this.localUploadDir = path.join(baseDir, 'uploads', 'adaku');

    if (endpoint && accessKeyId && secretAccessKey && this.bucket) {
      this.s3Client = new S3Client({
        region: 'auto',
        endpoint,
        credentials: {
          accessKeyId,
          secretAccessKey,
        },
      });
    } else if (process.env.VERCEL) {
      console.warn(
        '[upload] Cloudflare R2 is not configured on Vercel. Uploaded images will be written to ' +
          `${this.localUploadDir} (ephemeral, and not served by the /uploads static route), so image ` +
          'URLs will break. Set CLOUDFLARE_R2_ENDPOINT, CLOUDFLARE_R2_ACCESS_KEY_ID, ' +
          'CLOUDFLARE_R2_SECRET_ACCESS_KEY and CLOUDFLARE_R2_BUCKET.'
      );
    }

    try {
      if (!fs.existsSync(this.localUploadDir)) {
        fs.mkdirSync(this.localUploadDir, { recursive: true });
      }
    } catch {
      // Ignore filesystem permission error in read-only serverless environments
    }
  }

  /**
   * Compresses image using Sharp (WebP, max 1600px, 85% quality).
   * Throws a 400 for files Sharp cannot decode (corrupt or not really an image).
   */
  async compressImage(buffer: Buffer): Promise<Buffer> {
    try {
      return await sharp(buffer)
        .rotate() // Auto-orient based on EXIF
        .resize({
          width: 1600,
          height: 1600,
          fit: 'inside',
          withoutEnlargement: true,
        })
        .webp({ quality: 85, effort: 4 })
        .toBuffer();
    } catch {
      throw Object.assign(new Error('Invalid or unsupported image file'), { status: 400 });
    }
  }

  /**
   * Compresses image using Sharp (WebP, max 1600px, 85% quality) and uploads to R2 or local storage
   */
  async processAndUploadImage(
    buffer: Buffer,
    businessId: string,
    prefix: string = 'adaku'
  ): Promise<UploadedImageResult> {
    const compressedBuffer = await this.compressImage(buffer);
    return this.uploadCompressed(compressedBuffer, businessId, prefix);
  }

  private async uploadCompressed(
    compressedBuffer: Buffer,
    businessId: string,
    prefix: string
  ): Promise<UploadedImageResult> {
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 8);
    const filename = `${businessId}_${prefix}_${timestamp}_${randomStr}.webp`;
    const key = `adaku/${businessId}/${filename}`;

    // 2. Upload to Cloudflare R2 if configured
    if (this.s3Client && this.bucket) {
      await this.s3Client.send(
        new PutObjectCommand({
          Bucket: this.bucket,
          Key: key,
          Body: compressedBuffer,
          ContentType: 'image/webp',
        })
      );

      const url = this.publicUrl ? `${this.publicUrl}/${key}` : `https://${this.bucket}.r2.cloudflarestorage.com/${key}`;
      return {
        url,
        key,
        uploadedAt: new Date(),
      };
    }

    // 3. Fallback: Save to local disk / /tmp
    try {
      if (!fs.existsSync(this.localUploadDir)) {
        fs.mkdirSync(this.localUploadDir, { recursive: true });
      }
      const localFilePath = path.join(this.localUploadDir, filename);
      await fs.promises.writeFile(localFilePath, compressedBuffer);

      return {
        url: `/uploads/adaku/${filename}`,
        key: filename,
        uploadedAt: new Date(),
      };
    } catch {
      // In-memory data URL fallback for serverless without R2
      const base64 = compressedBuffer.toString('base64');
      return {
        url: `data:image/webp;base64,${base64}`,
        key: filename,
        uploadedAt: new Date(),
      };
    }
  }

  /**
   * Process multiple image buffers (up to 5)
   */
  async processMultipleImages(
    files: Express.Multer.File[],
    businessId: string
  ): Promise<UploadedImageResult[]> {
    const limit = Math.min(files.length, 5); // Max 5 photos

    // Compress every photo first so one bad file fails the request before anything is uploaded
    const compressed: Buffer[] = [];
    for (let i = 0; i < limit; i++) {
      compressed.push(await this.compressImage(files[i].buffer));
    }

    const results: UploadedImageResult[] = [];
    for (let i = 0; i < compressed.length; i++) {
      results.push(await this.uploadCompressed(compressed[i], businessId, `scale_${i + 1}`));
    }

    return results;
  }
}

export const uploadService = new UploadService();
