import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MinLength, Matches, IsOptional } from 'class-validator';

export class RegisterDto {
  @ApiProperty({ example: 'Rahul Sharma', description: 'Customer full name' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({ example: '+919876543211', description: '10-digit Indian mobile number' })
  @IsString()
  @IsNotEmpty()
  phone!: string;

  @ApiProperty({ example: 'CustomerPass123!', description: 'Password (min 6 chars)' })
  @IsString()
  @MinLength(6, { message: 'Password must be at least 6 characters long' })
  password!: string;

  @ApiProperty({ example: 'CustomerPass123!', description: 'Confirm password match' })
  @IsString()
  @IsNotEmpty()
  confirmPassword!: string;

  @ApiPropertyOptional({ example: '123 Mg Road, Indiranagar, Bengaluru', description: 'Customer default delivery address' })
  @IsOptional()
  @IsString()
  address?: string;
}
