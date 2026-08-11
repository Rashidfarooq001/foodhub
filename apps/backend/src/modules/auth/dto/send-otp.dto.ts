import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, Matches } from 'class-validator';

export class SendOtpDto {
  @ApiProperty({ example: '+919876543210', description: 'Customer or Admin phone number with country code' })
  @IsNotEmpty()
  @IsString()
  @Matches(/^(\+91|91)?[6-9]\d{9}$/, { message: 'Invalid Indian phone number format' })
  phone: string;

  @ApiPropertyOptional({ example: 'HOTEL', description: 'Target portal role (HOTEL, DELIVERY, CUSTOMER)' })
  @IsOptional()
  @IsString()
  targetRole?: string;
}
