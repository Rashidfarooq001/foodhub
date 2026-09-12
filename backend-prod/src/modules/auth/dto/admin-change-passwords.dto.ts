import { IsString, IsOptional, Matches } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class AdminChangePasswordsDto {
  @ApiPropertyOptional({ example: '1234567890123456' })
  @IsString()
  @IsOptional()
  @Matches(/^\d{16}$/, { message: 'Password 1 must be exactly 16 numeric digits' })
  newPassword1?: string;

  @ApiPropertyOptional({ example: '12345678' })
  @IsString()
  @IsOptional()
  @Matches(/^\d{8}$/, { message: 'Password 2 must be exactly 8 numeric digits' })
  newPassword2?: string;
}
