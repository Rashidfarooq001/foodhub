import { IsString, IsNotEmpty, IsEmail, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { VehicleType } from '@prisma/client';

export class CreateDriverDto {
  @ApiProperty({ example: 'Vikram Singh' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({ example: '+919876500999' })
  @IsString()
  @IsNotEmpty()
  phone!: string;

  @ApiPropertyOptional({ example: 'driver@foodhub.com' })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiPropertyOptional({ example: 'DriverPass123!' })
  @IsString()
  @IsOptional()
  password?: string;

  @ApiProperty({ example: 'DL-91827364501928' })
  @IsString()
  @IsNotEmpty()
  licenseNumber!: string;

  @ApiPropertyOptional({ example: 'BIKE' })
  @IsEnum(VehicleType)
  @IsOptional()
  vehicleType?: VehicleType;

  @ApiPropertyOptional({ example: 'KA-01-AB-1234' })
  @IsString()
  @IsOptional()
  vehicleNumber?: string;

  @ApiPropertyOptional({ example: 'Bengaluru, Karnataka' })
  @IsString()
  @IsOptional()
  address?: string;

  @ApiPropertyOptional({ example: 'HDFC Bank' })
  @IsString()
  @IsOptional()
  bankName?: string;

  @ApiPropertyOptional({ example: '98765432101' })
  @IsString()
  @IsOptional()
  accountNumber?: string;

  @ApiPropertyOptional({ example: 'HDFC0001234' })
  @IsString()
  @IsOptional()
  ifsc?: string;

  @ApiPropertyOptional({ example: 'driver@upi' })
  @IsString()
  @IsOptional()
  upiId?: string;

  @ApiPropertyOptional({ example: 'https://assets.foodhub.local/docs/dl-1.pdf' })
  @IsString()
  @IsOptional()
  licenseUrl?: string;

  @ApiPropertyOptional({ example: 'https://assets.foodhub.local/docs/rc-1.pdf' })
  @IsString()
  @IsOptional()
  rcUrl?: string;

  @ApiPropertyOptional({ example: 'https://assets.foodhub.local/docs/aadhaar-1.pdf' })
  @IsString()
  @IsOptional()
  idProofUrl?: string;
}
