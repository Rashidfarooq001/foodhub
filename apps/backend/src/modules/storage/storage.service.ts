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

    const imageMimes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
    const videoMimes = ['video/mp4', 'video/quicktime', 'video/webm'];

    if (acceptType === 'image' && !imageMimes.includes(file.mimetype)) {
      throw new BadRequestException('Invalid image format. Allowed formats: JPG, JPEG, PNG, WEBP');
    }

    if (acceptType === 'video' && !videoMimes.includes(file.mimetype)) {
      throw new BadRequestException('Invalid video format. Allowed formats: MP4, MOV, WEBM');
    }

    const isVideo = videoMimes.includes(file.mimetype);
    const maxSize = isVideo ? 100 * 1024 * 1024 : 5 * 1024 * 1024;

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
    const filePath = path.join(this.uploadDir, filename);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      return { success: true, message: 'File deleted' };
    }
    return { success: false, message: 'File not found' };
  }
}
