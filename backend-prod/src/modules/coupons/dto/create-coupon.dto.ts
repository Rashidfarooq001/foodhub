import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsNumber,
  IsOptional,
  IsDateString,
  Min,
  Max,
  IsInt,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CouponType } from '@prisma/client';

export class CreateCouponDto {
  @ApiProperty({ example: 'SAVE50' })
  @IsString()
  @IsNotEmpty()
  code!: string;

  @ApiProperty({ enum: CouponType })
  @IsEnum(CouponType)
  couponType!: CouponType;

  @ApiProperty({ example: 50, description: 'Flat ₹ or percentage value' })
  @IsNumber()
  @Min(0)
  discountVal!: number;

  @ApiPropertyOptional({ example: 199, description: 'Minimum order value to apply' })
  @IsNumber()
  @IsOptional()
  minOrderVal?: number;

  @ApiPropertyOptional({ example: 100, description: 'Maximum discount cap (for percentage)' })
  @IsNumber()
  @IsOptional()
  maxDiscount?: number;

  @ApiProperty({ example: '2026-08-01T00:00:00.000Z' })
  @IsDateString()
  validFrom!: string;

  @ApiProperty({ example: '2026-09-01T00:00:00.000Z' })
  @IsDateString()
  validTill!: string;

  @ApiPropertyOptional({ example: 500 })
  @IsInt()
  @IsOptional()
  usageLimit?: number;
}
