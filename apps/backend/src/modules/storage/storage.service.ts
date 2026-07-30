import { Injectable, BadRequestException } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class StorageService {
  private readonly uploadDir = path.join(process.cwd(), 'uploads');

  constructor() {
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

  saveUploadedFile(file: any) {
    const ext = path.extname(file.originalname || '.jpg');
    const uniqueFilename = `file-${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    const filePath = path.join(this.uploadDir, uniqueFilename);

    if (file.buffer) {
      fs.writeFileSync(filePath, file.buffer);
    } else if (file.path && fs.existsSync(file.path)) {
      fs.copyFileSync(file.path, filePath);
    }

    return {
      url: this.getPublicUrl(uniqueFilename),
      filename: uniqueFilename,
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
    };
  }

  getPublicUrl(filename: string): string {
    const host = (process.env.PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000').replace(/\/+$/, '');
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
