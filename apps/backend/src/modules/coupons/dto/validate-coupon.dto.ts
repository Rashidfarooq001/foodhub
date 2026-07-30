import { IsString, IsNotEmpty, IsNumber, Min, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ValidateCouponDto {
  @ApiProperty({ example: 'SAVE50' })
  @IsString()
  @IsNotEmpty()
  code!: string;

  @ApiProperty({ example: 350.00 })
  @IsNumber()
  @Min(0)
  subtotal!: number;

  @ApiProperty({ example: 'uuid-restaurant' })
  @IsUUID()
  restaurantId!: string;
}
