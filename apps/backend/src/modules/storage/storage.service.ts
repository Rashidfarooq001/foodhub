import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class StorageService {
  private readonly uploadDir = path.join(process.cwd(), 'uploads');
  private readonly logger = new Logger(StorageService.name);

  constructor(private readonly prisma: PrismaService) {
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
  }


  validateFile(file: any, acceptType: 'image' | 'video' | 'any' = 'any') {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    const allowedImageMimes = [
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/jpg',
    ];
    const allowedVideoMimes = [
      'video/mp4',
      'video/quicktime',
      'video/webm',
    ];

    const allowedImageExts = ['.jpg', '.jpeg', '.png', '.webp'];
    const allowedVideoExts = ['.mp4', '.mov', '.webm'];

    const fileExt = path.extname(file.originalname || '').toLowerCase();

    if (acceptType === 'image') {
      if (!allowedImageMimes.includes(file.mimetype) || !allowedImageExts.includes(fileExt)) {
        throw new BadRequestException('Invalid image format. Allowed formats: JPG, JPEG, PNG, WEBP');
      }
    } else if (acceptType === 'video') {
      if (!allowedVideoMimes.includes(file.mimetype) || !allowedVideoExts.includes(fileExt)) {
        throw new BadRequestException('Invalid video format. Allowed formats: MP4, MOV, WEBM');
      }
    } else {
      // 'any' allowed media
      const isAllowedImage = allowedImageMimes.includes(file.mimetype) && allowedImageExts.includes(fileExt);
      const isAllowedVideo = allowedVideoMimes.includes(file.mimetype) && allowedVideoExts.includes(fileExt);
      if (!isAllowedImage && !isAllowedVideo) {
        throw new BadRequestException('Unsupported media format. Allowed formats: JPG, JPEG, PNG, WEBP, MP4, MOV, WEBM');
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
    const filePath = path.join(this.uploadDir, uniqueFilename);

    let fileBuffer: Buffer | null = null;

    if (file.buffer) {
      fileBuffer = file.buffer;
      fs.writeFileSync(filePath, file.buffer);
    } else if (file.path && fs.existsSync(file.path)) {
      fileBuffer = fs.readFileSync(file.path);
      fs.copyFileSync(file.path, filePath);
    }

    // Persist file binary in PostgreSQL database to survive ephemeral container restarts
    if (fileBuffer && this.prisma) {
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
      host = (
        process.env.PUBLIC_API_URL ||
        process.env.NEXT_PUBLIC_API_URL ||
        'https://foodhub-backend-enq2.onrender.com'
      );
    } else {
      host = `http://localhost:${process.env.PORT || 4000}`;
    }

    host = host.trim().replace(/\/+$/, '').replace(/\/api\/v1\/?$/, '');

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
