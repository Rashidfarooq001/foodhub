import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, IsUrl } from 'class-validator';
import { Gender } from '@prisma/client';

export class UpdateProfileDto {
  @ApiPropertyOptional({ example: 'Aarav' })
  @IsOptional()
  @IsString()
  firstName?: string;

  @ApiPropertyOptional({ example: 'Sharma' })
  @IsOptional()
  @IsString()
  lastName?: string;

  @ApiPropertyOptional({ enum: Gender, example: Gender.MALE })
  @IsOptional()
  @IsEnum(Gender)
  gender?: Gender;

  @ApiPropertyOptional({ example: 'https://assets.foodhub.local/avatars/user-1.jpg' })
  @IsOptional()
  @IsString()
  avatarUrl?: string | null;
}
