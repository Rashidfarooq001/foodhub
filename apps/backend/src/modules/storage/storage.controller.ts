import {
  Controller,
  Post,
  Delete,
  Param,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  Query,
  UseGuards,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiConsumes, ApiBody, ApiBearerAuth } from '@nestjs/swagger';
import * as path from 'path';
import { StorageService } from './storage.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

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
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 25 * 1024 * 1024 } }))
  async uploadFile(@UploadedFile() file: any, @Query('type') type?: 'image' | 'video' | 'any') {
    if (!file) {
      throw new BadRequestException('No file provided in form-data field "file"');
    }

    this.storageService.validateFile(file, type || 'any');
    return await this.storageService.saveUploadedFile(file);
  }

  @Delete('file/:filename')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'ADMIN', 'RESTAURANT_OWNER')
  @ApiOperation({ summary: 'Delete uploaded media file (Admin / Restaurant Owner)' })
  async deleteFile(@Param('filename') filename: string) {
    return this.storageService.deleteFile(filename);
  }
}
