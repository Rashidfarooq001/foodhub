import {
  IsString,
  IsNotEmpty,
  IsArray,
  IsEnum,
  IsOptional,
  IsBoolean,
  ValidateNested,
  IsNumber,
  Min,
  IsUUID,
  IsObject,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaymentMethod } from '@prisma/client';

export class OrderItemDto {
  @ApiProperty({ example: 'uuid-food-item' })
  @IsUUID()
  foodItemId!: string;

  @ApiPropertyOptional({ example: 'uuid-variant' })
  @IsOptional()
  @IsUUID()
  variantId?: string;

  @ApiPropertyOptional({ example: 'Full' })
  @IsOptional()
  @IsString()
  variantName?: string;

  @ApiProperty({ example: 2 })
  @IsNumber()
  @Min(1)
  quantity!: number;

  @ApiPropertyOptional({ example: [{ addonId: 'uuid', name: 'Extra Cheese', price: 40 }] })
  @IsOptional()
  addonsJson?: Record<string, unknown>[];
}

export class CreateOrderDto {
  @ApiProperty({ example: 'uuid-restaurant' })
  @IsUUID()
  restaurantId!: string;

  @ApiProperty({ type: [OrderItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items!: OrderItemDto[];

  @ApiPropertyOptional({ example: { line1: 'MG Road', city: 'Bengaluru', lat: 12.97, lng: 77.59 } })
  @IsObject()
  @IsOptional()
  deliveryAddress?: Record<string, unknown>;

  @ApiProperty({ enum: PaymentMethod, example: 'UPI' })
  @IsEnum(PaymentMethod)
  paymentMethod!: PaymentMethod;

  @ApiPropertyOptional({ example: 'SAVE50' })
  @IsString()
  @IsOptional()
  couponCode?: string;

  @ApiPropertyOptional({ example: 'Ring the bell on arrival' })
  @IsString()
  @IsOptional()
  specialInstruction?: string;

  @ApiPropertyOptional({ example: false })
  @IsBoolean()
  @IsOptional()
  useWallet?: boolean;

  @ApiPropertyOptional({ example: 30 })
  @IsNumber()
  @IsOptional()
  tipAmount?: number;
}
