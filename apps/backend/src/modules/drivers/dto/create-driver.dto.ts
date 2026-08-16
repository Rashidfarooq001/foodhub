import { IsString, IsNotEmpty, IsEmail, IsOptional, IsEnum } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { VehicleType } from '@prisma/client';

/**
 * DTO for admin-direct driver creation (POST /drivers).
 *
 * IMPORTANT ARCHITECTURE RULES:
 * - vehicleType is REQUIRED when vehicleNumber is provided.
 *   The service layer enforces this. Never silently fallback to MOTORCYCLE.
 * - licenseNumber is REQUIRED — no auto-generated DL numbers.
 * - password is REQUIRED — no hardcoded default passwords.
 * - email: empty string → undefined (avoids unique constraint on empty string).
 * - All document URLs must be real uploaded file URLs from storage.
 */
export class CreateDriverDto {
  @ApiProperty({ description: 'Full name of the delivery partner' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({ description: 'Indian mobile phone number' })
  @IsString()
  @IsNotEmpty()
  phone!: string;

  @ApiPropertyOptional({ description: 'Email address (optional)' })
  @Transform(({ value }) => (value === null || value === '' ? undefined : value))
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiProperty({ description: 'Account password — must be provided by admin' })
  @IsString()
  @IsNotEmpty()
  password!: string;

  @ApiProperty({ description: 'Official driving license number (required, must be unique)' })
  @IsString()
  @IsNotEmpty()
  licenseNumber!: string;

  @ApiPropertyOptional({
    description: 'Vehicle type — must exactly match one of: BICYCLE, SCOOTER, MOTORCYCLE, EV_SCOOTER',
    enum: VehicleType,
  })
  @IsEnum(VehicleType, {
    message: 'vehicleType must be one of: BICYCLE, SCOOTER, MOTORCYCLE, EV_SCOOTER',
  })
  @IsOptional()
  vehicleType?: VehicleType;

  @ApiPropertyOptional({ description: 'Vehicle registration number (e.g. JK-01-AB-1234)' })
  @Transform(({ value }) => (value === null || value === '' ? undefined : value))
  @IsString()
  @IsOptional()
  vehicleNumber?: string;

  @ApiPropertyOptional({ description: 'Operating city or area address' })
  @Transform(({ value }) => (value === null || value === '' ? undefined : value))
  @IsString()
  @IsOptional()
  address?: string;

  @ApiPropertyOptional({ description: 'Bank name for payout' })
  @Transform(({ value }) => (value === null || value === '' ? undefined : value))
  @IsString()
  @IsOptional()
  bankName?: string;

  @ApiPropertyOptional({ description: 'Bank account number' })
  @Transform(({ value }) => (value === null || value === '' ? undefined : value))
  @IsString()
  @IsOptional()
  accountNumber?: string;

  @ApiPropertyOptional({ description: 'Bank IFSC code' })
  @Transform(({ value }) => (value === null || value === '' ? undefined : value))
  @IsString()
  @IsOptional()
  ifsc?: string;

  @ApiPropertyOptional({ description: 'UPI ID for payout' })
  @Transform(({ value }) => (value === null || value === '' ? undefined : value))
  @IsString()
  @IsOptional()
  upiId?: string;

  @ApiPropertyOptional({ description: 'URL of uploaded driving license document' })
  @Transform(({ value }) => (value === null || value === '' ? undefined : value))
  @IsString()
  @IsOptional()
  licenseUrl?: string;

  @ApiPropertyOptional({ description: 'URL of uploaded vehicle RC document' })
  @Transform(({ value }) => (value === null || value === '' ? undefined : value))
  @IsString()
  @IsOptional()
  rcUrl?: string;

  @ApiPropertyOptional({ description: 'URL of uploaded Aadhaar / ID proof document' })
  @Transform(({ value }) => (value === null || value === '' ? undefined : value))
  @IsString()
  @IsOptional()
  idProofUrl?: string;
}
