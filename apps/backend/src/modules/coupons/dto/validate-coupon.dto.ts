import { IsString, IsNotEmpty, IsNumber, Min, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ValidateCouponDto {
  @ApiProperty({ example: 'SAVE50' })
  @IsString()
  @IsNotEmpty()
  code!: string;

  @ApiProperty({ example: 350.0 })
  @IsNumber()
  @Min(0)
  subtotal!: number;

  @ApiPropertyOptional({ example: 'uuid-restaurant' })
  @IsString()
  @IsOptional()
  restaurantId?: string;
}
