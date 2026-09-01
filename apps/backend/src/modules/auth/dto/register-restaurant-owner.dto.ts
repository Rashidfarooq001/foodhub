import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsEmail, IsNotEmpty, MinLength, IsOptional, IsNumber } from 'class-validator';

export class RegisterRestaurantOwnerDto {
  @ApiProperty({ example: 'Rahul Sharma', description: 'Restaurant owner full name' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: '+919876543210', description: 'Owner mobile phone number' })
  @IsString()
  @IsNotEmpty()
  phone: string;

  @ApiProperty({ example: 'rahul.sharma@example.com', description: 'Owner email address' })
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

  @ApiProperty({ example: 'Royal Kashmir Dhaba', description: 'Restaurant name' })
  @IsString()
  @IsNotEmpty()
  restaurantName: string;

  @ApiProperty({ example: 'Main Market Road', description: 'Address line' })
  @IsString()
  @IsNotEmpty()
  addressLine: string;

  @ApiProperty({ example: 'Bandipora', description: 'City' })
  @IsString()
  @IsNotEmpty()
  city: string;

  @ApiProperty({ example: 'Jammu & Kashmir', description: 'State' })
  @IsString()
  @IsNotEmpty()
  state: string;

  @ApiProperty({ example: '193502', description: 'Postal Code' })
  @IsString()
  @IsNotEmpty()
  postalCode: string;

  @ApiPropertyOptional({ example: 34.3868, description: 'Latitude' })
  @IsOptional()
  @IsNumber()
  latitude?: number;

  @ApiPropertyOptional({ example: 74.5221, description: 'Longitude' })
  @IsOptional()
  @IsNumber()
  longitude?: number;

  @ApiPropertyOptional({ example: 'FSSAI-12345678901234', description: 'FSSAI license number' })
  @IsOptional()
  @IsString()
  fssaiNumber?: string;

  @ApiPropertyOptional({ example: '01AAAAA0000A1Z5', description: 'GSTIN number' })
  @IsOptional()
  @IsString()
  gstin?: string;

  @ApiPropertyOptional({ example: 'Rahul Sharma', description: 'Bank account holder name' })
  @IsOptional()
  @IsString()
  accountHolder?: string;

  @ApiPropertyOptional({ example: '123456789012', description: 'Bank account number' })
  @IsOptional()
  @IsString()
  accountNumber?: string;

  @ApiPropertyOptional({ example: 'HDFC0001234', description: 'Bank IFSC Code' })
  @IsOptional()
  @IsString()
  ifscCode?: string;

  @ApiPropertyOptional({ example: 'HDFC Bank', description: 'Bank Name' })
  @IsOptional()
  @IsString()
  bankName?: string;

}