import { IsInt, Min, Max, IsUUID, IsOptional, IsString, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateRestaurantReviewDto {
  @ApiProperty({ example: 'uuid-order' })
  @IsUUID()
  orderId!: string;

  @ApiProperty({ example: 4, minimum: 1, maximum: 5 })
  @IsInt()
  @Min(1)
  @Max(5)
  rating!: number;

  @IsOptional()
  @IsUUID()
  restaurantId?: string;

  @IsOptional()
  @IsString()
  comment?: string;

  @IsOptional()
  @IsBoolean()
  isAnonymous?: boolean;
}

export class CreateFoodReviewDto {
  @ApiProperty({ example: 'uuid-order' })
  @IsUUID()
  orderId!: string;

  @ApiProperty({ example: 'uuid-food-item' })
  @IsUUID()
  foodItemId!: string;

  @ApiProperty({ example: 5, minimum: 1, maximum: 5 })
  @IsInt()
  @Min(1)
  @Max(5)
  rating!: number;
}

export class CreateDriverReviewDto {
  @ApiProperty({ example: 'uuid-order' })
  @IsUUID()
  orderId!: string;

  @ApiProperty({ example: 5, minimum: 1, maximum: 5 })
  @IsInt()
  @Min(1)
  @Max(5)
  rating!: number;

  @IsOptional()
  @IsUUID()
  driverId?: string;

  @IsOptional()
  @IsString()
  comment?: string;

  @IsOptional()
  @IsBoolean()
  isAnonymous?: boolean;
}
