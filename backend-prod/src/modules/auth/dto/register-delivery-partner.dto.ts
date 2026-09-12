import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsEmail, IsNotEmpty, MinLength, IsOptional, IsEnum } from 'class-validator';
import { VehicleType } from '@prisma/client';

export class RegisterDeliveryPartnerDto {
  @ApiProperty({ example: 'Aadil Ahmad', description: 'Courier partner full name' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: '+919876543211', description: 'Driver mobile phone number' })
  @IsString()
  @IsNotEmpty()
  phone: string;

  @ApiProperty({ example: 'aadil.ahmad@example.com', description: 'Driver email address' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: 'Pass1234!', description: 'Account password' })
  @IsString()
  @MinLength(8)
  password: string;

  @ApiProperty({ example: 'Pass1234!', description: 'Confirm password' })
  @IsString()
  @MinLength(8)
  confirmPassword: string;

  @ApiProperty({ example: 'MOTORCYCLE', enum: VehicleType, description: 'Vehicle type' })
  @IsEnum(VehicleType)
  @IsNotEmpty()
  vehicleType: VehicleType;

  @ApiProperty({ example: 'JK-15-A-1234', description: 'Vehicle registration number' })
  @IsString()
  @IsNotEmpty()
  vehicleNumber: string;

  @ApiProperty({ example: 'JK1520240012345', description: 'Driving license number' })
  @IsString()
  @IsNotEmpty()
  licenseNumber: string;

  @ApiPropertyOptional({ example: 'Kehnusa Bus Stop', description: 'Address line' })
  @IsOptional()
  @IsString()
  addressLine?: string;

  @ApiPropertyOptional({ example: 'Bandipora', description: 'City' })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({ example: 'Jammu & Kashmir', description: 'State' })
  @IsOptional()
  @IsString()
  state?: string;

  @ApiPropertyOptional({ example: '193502', description: 'Postal Code' })
  @IsOptional()
  @IsString()
  postalCode?: string;
}
