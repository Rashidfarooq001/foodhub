import {
  IsString,
  IsNotEmpty,
  IsArray,
  IsEmail,
  IsNumber,
  IsOptional,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateRestaurantDto {
  @ApiPropertyOptional({ example: 'uuid-of-owner-user' })
  @IsString()
  @IsOptional()
  ownerId?: string;

  @ApiPropertyOptional({ example: 'Ananya Verma' })
  @IsString()
  @IsOptional()
  ownerName?: string;

  @ApiProperty({ example: 'Spice Garden Restaurant' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({ example: '+919876543210' })
  @IsString()
  @IsNotEmpty()
  phone!: string;

  @ApiPropertyOptional({ example: 'ananya@spicegarden.com' })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiPropertyOptional({ example: 'Password123!' })
  @IsString()
  @IsOptional()
  password?: string;

  @ApiPropertyOptional({ example: 'Authentic Indian Curry & Tandoor' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ example: ['North Indian', 'Biryani'] })
  @IsArray()
  @IsOptional()
  cuisines?: string[];

  @ApiProperty({ example: '11223344556677' })
  @IsString()
  @IsOptional()
  fssaiLicense?: string;

  @ApiPropertyOptional({ example: '29ABCDE1234F1Z5' })
  @IsString()
  @IsOptional()
  gstin?: string;

  @ApiProperty({ example: 'MG Road, Indiranagar, Bengaluru' })
  @IsString()
  @IsOptional()
  address?: string;

  @ApiPropertyOptional({ example: 'Bengaluru' })
  @IsString()
  @IsOptional()
  city?: string;

  @ApiPropertyOptional({ example: 'Karnataka' })
  @IsString()
  @IsOptional()
  state?: string;

  @ApiPropertyOptional({ example: 'India' })
  @IsString()
  @IsOptional()
  country?: string;

  @ApiPropertyOptional({ example: '560038' })
  @IsString()
  @IsOptional()
  pin?: string;

  @ApiPropertyOptional({ example: 12.9716 })
  @IsNumber()
  @IsOptional()
  latitude?: number;

  @ApiPropertyOptional({ example: 77.5946 })
  @IsNumber()
  @IsOptional()
  longitude?: number;

  @ApiPropertyOptional({ example: '09:00' })
  @IsString()
  @IsOptional()
  openingHours?: string;

  @ApiPropertyOptional({ example: '23:00' })
  @IsString()
  @IsOptional()
  closingHours?: string;

  @ApiPropertyOptional({ example: 7.5 })
  @IsNumber()
  @IsOptional()
  deliveryRadius?: number;

  @ApiPropertyOptional({ example: 25 })
  @IsNumber()
  @IsOptional()
  packagingFee?: number;

  @ApiPropertyOptional({ example: 40 })
  @IsNumber()
  @IsOptional()
  deliveryFee?: number;

  @ApiPropertyOptional({ example: 199 })
  @IsNumber()
  @IsOptional()
  minOrder?: number;

  @ApiPropertyOptional({ example: 'https://images.unsplash.com/logo.png' })
  @IsString()
  @IsOptional()
  logoUrl?: string;

  @ApiPropertyOptional({ example: 'https://images.unsplash.com/banner.png' })
  @IsString()
  @IsOptional()
  bannerUrl?: string;

  @ApiPropertyOptional({ example: 'HDFC Bank' })
  @IsString()
  @IsOptional()
  bankName?: string;

  @ApiPropertyOptional({ example: '918273645019' })
  @IsString()
  @IsOptional()
  accountNumber?: string;

  @ApiPropertyOptional({ example: 'HDFC0001234' })
  @IsString()
  @IsOptional()
  ifsc?: string;

  @ApiPropertyOptional({ example: 'spicegarden@hdfc' })
  @IsString()
  @IsOptional()
  upiId?: string;
}
