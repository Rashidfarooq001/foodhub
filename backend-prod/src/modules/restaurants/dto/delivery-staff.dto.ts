import { IsEnum, IsNotEmpty, IsOptional, IsString, IsEmail } from 'class-validator';
import { DeliveryMode, RestaurantDriverStatus } from '@prisma/client';

export class UpdateDeliveryModeDto {
  @IsEnum(DeliveryMode)
  deliveryMode: DeliveryMode;
}

export class CreateDeliveryStaffDto {
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @IsString()
  @IsOptional()
  lastName?: string;

  @IsString()
  @IsNotEmpty()
  phone: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  avatar?: string;

  @IsString()
  @IsOptional()
  vehicleType?: string;

  @IsString()
  @IsOptional()
  vehicleNumber?: string;
}

export class UpdateDeliveryStaffDto {
  @IsString()
  @IsOptional()
  firstName?: string;

  @IsString()
  @IsOptional()
  lastName?: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  avatar?: string;

  @IsString()
  @IsOptional()
  vehicleType?: string;

  @IsString()
  @IsOptional()
  vehicleNumber?: string;

  @IsEnum(RestaurantDriverStatus)
  @IsOptional()
  status?: RestaurantDriverStatus;

  @IsOptional()
  isActive?: boolean;
}
