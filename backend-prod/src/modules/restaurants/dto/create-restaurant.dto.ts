import { IsString, IsNotEmpty, IsArray, IsEmail, IsNumber, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';

/**
 * DTO for creating a restaurant via the Admin or Customer-Web registration form.
 *
 * IMPORTANT:
 * - latitude / longitude: Sent as null by the frontend when GPS has not been
 *   captured. @Transform converts null → undefined so that @IsNumber() +
 *   @IsOptional() behaves correctly (null fails @IsNumber, undefined skips it).
 * - email: Empty string "" is converted to undefined to avoid @IsEmail failures
 *   on blank optional fields.
 * - fssaiLicense / gstin / panNumber: All optional; empty string → undefined.
 * - No hardcoded defaults are applied here — the service layer must reject or
 *   store NULL for any missing required data.
 */
export class CreateRestaurantDto {
  @ApiPropertyOptional({ description: 'UUID of an existing owner user (admin use)' })
  @IsString()
  @IsOptional()
  ownerId?: string;

  @ApiPropertyOptional({ description: 'Full name of the restaurant owner' })
  @IsString()
  @IsOptional()
  ownerName?: string;

  @ApiProperty({ description: 'Restaurant display name' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({ description: 'Restaurant contact phone number' })
  @IsString()
  @IsNotEmpty()
  phone!: string;

  @ApiPropertyOptional({ description: 'Restaurant email address' })
  @Transform(({ value }) => (value === null || value === '' ? undefined : value))
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiPropertyOptional({ description: 'Account password for restaurant login' })
  @Transform(({ value }) => (value === null || value === '' ? undefined : value))
  @IsString()
  @IsOptional()
  password?: string;

  @ApiPropertyOptional({ description: 'Short restaurant description or tagline' })
  @Transform(({ value }) => (value === null || value === '' ? undefined : value))
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ description: 'List of cuisine types served' })
  @IsArray()
  @IsOptional()
  cuisines?: string[];

  @ApiPropertyOptional({ description: '14-digit FSSAI license number' })
  @Transform(({ value }) => (value === null || value === '' ? undefined : value))
  @IsString()
  @IsOptional()
  fssaiLicense?: string;

  @ApiPropertyOptional({ description: 'GSTIN number' })
  @Transform(({ value }) => (value === null || value === '' ? undefined : value))
  @IsString()
  @IsOptional()
  gstin?: string;

  @ApiPropertyOptional({ description: 'Street address line' })
  @Transform(({ value }) => (value === null || value === '' ? undefined : value))
  @IsString()
  @IsOptional()
  address?: string;

  @ApiPropertyOptional({ description: 'City name' })
  @Transform(({ value }) => (value === null || value === '' ? undefined : value))
  @IsString()
  @IsOptional()
  city?: string;

  @ApiPropertyOptional({ description: 'State name' })
  @Transform(({ value }) => (value === null || value === '' ? undefined : value))
  @IsString()
  @IsOptional()
  state?: string;

  @ApiPropertyOptional({ description: 'Country name' })
  @Transform(({ value }) => (value === null || value === '' ? undefined : value))
  @IsString()
  @IsOptional()
  country?: string;

  @ApiPropertyOptional({ description: 'PIN / postal code' })
  @Transform(({ value }) => (value === null || value === '' ? undefined : value))
  @IsString()
  @IsOptional()
  pin?: string;

  /**
   * GPS latitude — the frontend sends null when location has not been captured.
   * @Transform converts null to undefined so @IsNumber() does not reject it.
   * If location is required for your flow, enforce it at the service layer and
   * return a 400: "Restaurant location is required."
   */
  @ApiPropertyOptional({ description: 'GPS latitude coordinate from Mappls / device GPS' })
  @Transform(({ value }) =>
    value === null || value === undefined || value === '' ? undefined : Number(value),
  )
  @IsNumber()
  @IsOptional()
  latitude?: number;

  /**
   * GPS longitude — same null-safety treatment as latitude.
   */
  @ApiPropertyOptional({ description: 'GPS longitude coordinate from Mappls / device GPS' })
  @Transform(({ value }) =>
    value === null || value === undefined || value === '' ? undefined : Number(value),
  )
  @IsNumber()
  @IsOptional()
  longitude?: number;

  @ApiPropertyOptional({ description: 'Opening time e.g. 09:00' })
  @Transform(({ value }) => (value === null || value === '' ? undefined : value))
  @IsString()
  @IsOptional()
  openingHours?: string;

  @ApiPropertyOptional({ description: 'Closing time e.g. 23:00' })
  @Transform(({ value }) => (value === null || value === '' ? undefined : value))
  @IsString()
  @IsOptional()
  closingHours?: string;

  @ApiPropertyOptional({ description: 'Delivery radius in km' })
  @Transform(({ value }) => (value === null || value === '' ? undefined : Number(value)))
  @IsNumber()
  @IsOptional()
  deliveryRadius?: number;

  @ApiPropertyOptional({ description: 'Packaging fee in INR' })
  @Transform(({ value }) => (value === null || value === '' ? undefined : Number(value)))
  @IsNumber()
  @IsOptional()
  packagingFee?: number;

  @ApiPropertyOptional({ description: 'Delivery fee in INR' })
  @Transform(({ value }) => (value === null || value === '' ? undefined : Number(value)))
  @IsNumber()
  @IsOptional()
  deliveryFee?: number;

  @ApiPropertyOptional({ description: 'Minimum order value in INR' })
  @Transform(({ value }) => (value === null || value === '' ? undefined : Number(value)))
  @IsNumber()
  @IsOptional()
  minOrder?: number;

  @ApiPropertyOptional({ description: 'URL of uploaded restaurant logo image' })
  @Transform(({ value }) => (value === null || value === '' ? undefined : value))
  @IsString()
  @IsOptional()
  logoUrl?: string;

  @ApiPropertyOptional({ description: 'URL of uploaded restaurant banner image' })
  @Transform(({ value }) => (value === null || value === '' ? undefined : value))
  @IsString()
  @IsOptional()
  bannerUrl?: string;

  @ApiPropertyOptional({ description: 'Bank account holder name' })
  @Transform(({ value }) => (value === null || value === '' ? undefined : value))
  @IsString()
  @IsOptional()
  accountHolder?: string;

  @ApiPropertyOptional({ description: 'Bank name for settlements' })
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

  @ApiPropertyOptional({ description: 'UPI ID for settlements' })
  @Transform(({ value }) => (value === null || value === '' ? undefined : value))
  @IsString()
  @IsOptional()
  upiId?: string;

  @ApiPropertyOptional({ description: 'URL of uploaded menu document' })
  @Transform(({ value }) => (value === null || value === '' ? undefined : value))
  @IsString()
  @IsOptional()
  menuUrl?: string;

  @ApiPropertyOptional({ description: 'URL of uploaded FSSAI certificate' })
  @Transform(({ value }) => (value === null || value === '' ? undefined : value))
  @IsString()
  @IsOptional()
  fssaiUrl?: string;

  @ApiPropertyOptional({ description: 'URL of uploaded PAN card document' })
  @Transform(({ value }) => (value === null || value === '' ? undefined : value))
  @IsString()
  @IsOptional()
  panUrl?: string;

  @ApiPropertyOptional({ description: 'PAN card number' })
  @Transform(({ value }) => (value === null || value === '' ? undefined : value))
  @IsString()
  @IsOptional()
  panNumber?: string;

  @ApiPropertyOptional({ description: 'URL of uploaded promotional video' })
  @Transform(({ value }) => (value === null || value === '' ? undefined : value))
  @IsString()
  @IsOptional()
  promoVideoUrl?: string;
}
