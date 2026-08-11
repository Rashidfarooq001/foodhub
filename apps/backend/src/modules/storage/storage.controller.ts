import {
  Controller,
  Post,
  Delete,
  Param,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  Query,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiConsumes, ApiBody } from '@nestjs/swagger';
import * as path from 'path';
import { StorageService } from './storage.service';

@ApiTags('Media Storage & Uploads')
@Controller('storage')
export class StorageController {
  constructor(private readonly storageService: StorageService) {}

  @Post('upload')
  @ApiOperation({ summary: 'Upload an image or video file (multipart/form-data)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
      },
    },
  })
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 100 * 1024 * 1024 } }))
  async uploadFile(
    @UploadedFile() file: any,
    @Query('type') type?: 'image' | 'video' | 'any',
  ) {
    if (!file) {
      throw new BadRequestException('No file provided in form-data field "file"');
    }

    this.storageService.validateFile(file, type || 'any');
    return await this.storageService.saveUploadedFile(file);
  }

  @Delete('file/:filename')
  @ApiOperation({ summary: 'Delete uploaded media file' })
  async deleteFile(@Param('filename') filename: string) {
    return this.storageService.deleteFile(filename);
  }
}
