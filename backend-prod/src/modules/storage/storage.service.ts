import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { PrismaService } from '../database/prisma.service';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

@Injectable()
export class StorageService {
  private readonly uploadDir = path.join(process.cwd(), 'uploads');
  private readonly logger = new Logger(StorageService.name);
  private readonly s3Client?: S3Client;
  private readonly s3BucketName?: string;
  private readonly s3Region?: string;

  constructor(private readonly prisma: PrismaService) {
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }

    if (process.env.AWS_S3_BUCKET_NAME) {
      this.s3BucketName = process.env.AWS_S3_BUCKET_NAME;
      this.s3Region = process.env.AWS_REGION || 'ap-south-1';
      this.s3Client = new S3Client({ region: this.s3Region });
    }
  }

  validateFile(file: any, acceptType: 'image' | 'video' | 'any' = 'any') {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    const allowedImageMimes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
    const allowedVideoMimes = ['video/mp4', 'video/quicktime', 'video/webm'];

    const allowedImageExts = ['.jpg', '.jpeg', '.png', '.webp'];
    const allowedVideoExts = ['.mp4', '.mov', '.webm'];

    const fileExt = path.extname(file.originalname || '').toLowerCase();

    if (acceptType === 'image') {
      if (!allowedImageMimes.includes(file.mimetype) || !allowedImageExts.includes(fileExt)) {
        throw new BadRequestException(
          'Invalid image format. Allowed formats: JPG, JPEG, PNG, WEBP',
        );
      }
    } else if (acceptType === 'video') {
      if (!allowedVideoMimes.includes(file.mimetype) || !allowedVideoExts.includes(fileExt)) {
        throw new BadRequestException('Invalid video format. Allowed formats: MP4, MOV, WEBM');
      }
    } else {
      // 'any' allowed media
      const isAllowedImage =
        allowedImageMimes.includes(file.mimetype) && allowedImageExts.includes(fileExt);
      const isAllowedVideo =
        allowedVideoMimes.includes(file.mimetype) && allowedVideoExts.includes(fileExt);
      if (!isAllowedImage && !isAllowedVideo) {
        throw new BadRequestException(
          'Unsupported media format. Allowed formats: JPG, JPEG, PNG, WEBP, MP4, MOV, WEBM',
        );
      }
    }

    const isVideo = acceptType === 'video' || allowedVideoMimes.includes(file.mimetype);
    const maxSize = isVideo ? 50 * 1024 * 1024 : 10 * 1024 * 1024;

    if (file.size > maxSize) {
      const sizeMb = (maxSize / (1024 * 1024)).toFixed(0);
      throw new BadRequestException(`File size exceeds maximum allowed limit of ${sizeMb}MB`);
    }

    return true;
  }

  async saveUploadedFile(file: any) {
    const ext = path.extname(file.originalname || '.jpg');
    const uniqueFilename = `file-${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;

    let fileBuffer: Buffer | null = null;
    if (file.buffer) {
      fileBuffer = file.buffer;
    } else if (file.path && fs.existsSync(file.path)) {
      fileBuffer = fs.readFileSync(file.path);
    }

    if (!fileBuffer) {
      throw new BadRequestException('File buffer is empty');
    }

    // 1. Check if S3 is configured
    if (this.s3Client && this.s3BucketName) {
      try {
        await this.s3Client.send(
          new PutObjectCommand({
            Bucket: this.s3BucketName,
            Key: `uploads/${uniqueFilename}`,
            Body: fileBuffer,
            ContentType: file.mimetype || 'image/jpeg',
          }),
        );

        const s3Url = `https://${this.s3BucketName}.s3.${this.s3Region}.amazonaws.com/uploads/${uniqueFilename}`;

        // Write the S3 metadata to Postgres SystemSettings instead of Base64 blob
        await (this.prisma as any).systemSetting.upsert({
          where: { key: `media_file_${uniqueFilename}` },
          update: { value: JSON.stringify({ mimeType: file.mimetype, s3Url }) },
          create: {
            key: `media_file_${uniqueFilename}`,
            value: JSON.stringify({ mimeType: file.mimetype, s3Url }),
          },
        });

        this.logger.log(`[Media Storage] Uploaded to S3: ${uniqueFilename}`);

        return {
          url: s3Url,
          filename: uniqueFilename,
          originalName: file.originalname,
          mimeType: file.mimetype,
          size: file.size,
        };
      } catch (err: any) {
        this.logger.error(`[S3 Upload Failed] Falling back to disk/db... ${err?.message}`);
      }
    }

    // 2. Fallback to Local Disk and Base64 Postgres Blob (Legacy Render Behavior)
    const filePath = path.join(this.uploadDir, uniqueFilename);
    fs.writeFileSync(filePath, fileBuffer);

    if (this.prisma) {
      try {
        const base64Data = fileBuffer.toString('base64');
        const mediaRecordValue = JSON.stringify({
          mimeType: file.mimetype || 'image/jpeg',
          base64: base64Data,
        });

        await (this.prisma as any).systemSetting.upsert({
          where: { key: `media_file_${uniqueFilename}` },
          update: { value: mediaRecordValue },
          create: {
            key: `media_file_${uniqueFilename}`,
            value: mediaRecordValue,
          },
        });
      } catch (err: any) {
        console.error('[Persistent Media Storage] DB backup error:', err);
        this.logger.warn(`[Persistent Media Storage] DB backup notice: ${err?.message}`);
      }
    }

    this.logger.log(
      `[Media Storage Upload] filename=${uniqueFilename}, originalName=${file.originalname}, mime=${file.mimetype}, size=${file.size} bytes`,
    );

    return {
      url: this.getPublicUrl(uniqueFilename),
      filename: uniqueFilename,
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
    };
  }

  getPublicUrl(filename: string): string {
    let host: string;

    if (process.env.PUBLIC_URL && process.env.PUBLIC_URL.trim()) {
      host = process.env.PUBLIC_URL.trim();
    } else if (process.env.NODE_ENV === 'production') {
      host =
        process.env.BACKEND_URL ||
        process.env.PUBLIC_API_URL ||
        process.env.NEXT_PUBLIC_API_URL ||
        process.env.RENDER_EXTERNAL_URL || // Render auto-sets this
        '';
      if (!host) {
        // Last resort: derive from PORT so media still works on any host
        host = `http://0.0.0.0:${process.env.PORT || 4000}`;
      }
    } else {
      host = `http://localhost:${process.env.PORT || 4000}`;
    }

    host = host
      .trim()
      .replace(/\/+$/, '')
      .replace(/\/api\/v1\/?$/, '');

    return `${host}/uploads/${filename}`;
  }

  deleteFile(filename: string) {
    if (!filename || typeof filename !== 'string') {
      throw new BadRequestException('Filename parameter is required.');
    }

    const safeFilename = path.basename(filename);
    const filePath = path.resolve(this.uploadDir, safeFilename);

    // Verify resolved path stays strictly within uploads directory
    if (!filePath.startsWith(path.resolve(this.uploadDir))) {
      throw new BadRequestException('Invalid file path.');
    }

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      return { success: true, message: 'File deleted' };
    }
    return { success: false, message: 'File not found' };
  }
}
