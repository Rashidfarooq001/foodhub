import { IsString, IsOptional, IsInt, Min, Max, IsBoolean, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateRestaurantReviewDto {
  @ApiProperty({ example: 'uuid-order' })
  @IsUUID()
  orderId!: string;

  @ApiProperty({ example: 'uuid-restaurant' })
  @IsUUID()
  restaurantId!: string;

  @ApiProperty({ example: 4, minimum: 1, maximum: 5 })
  @IsInt()
  @Min(1)
  @Max(5)
  rating!: number;

  @ApiPropertyOptional({ example: 'Great food and fast delivery!' })
  @IsString()
  @IsOptional()
  comment?: string;

  @ApiPropertyOptional({ default: false })
  @IsBoolean()
  @IsOptional()
  isAnonymous?: boolean;
}

export class CreateFoodReviewDto {
  @ApiProperty({ example: 'uuid-order' })
  @IsUUID()
  orderId!: string;

  @ApiProperty({ example: 'uuid-food-item' })
  @IsUUID()
  foodItemId!: string;

  @ApiProperty({ example: 5 })
  @IsInt()
  @Min(1)
  @Max(5)
  rating!: number;

  @ApiPropertyOptional({ example: 'Crispy and delicious!' })
  @IsString()
  @IsOptional()
  comment?: string;
}

export class CreateDriverReviewDto {
  @ApiProperty({ example: 'uuid-order' })
  @IsUUID()
  orderId!: string;

  @ApiProperty({ example: 'uuid-driver' })
  @IsUUID()
  driverId!: string;

  @ApiProperty({ example: 5 })
  @IsInt()
  @Min(1)
  @Max(5)
  rating!: number;

  @ApiPropertyOptional({ example: 'Very professional and on time.' })
  @IsString()
  @IsOptional()
  comment?: string;
}

export class ReportReviewDto {
  @ApiProperty({ example: 'Contains inappropriate language' })
  @IsString()
  reason!: string;
}

export class ReplyReviewDto {
  @ApiProperty({ example: 'Thank you for your feedback! We will improve.' })
  @IsString()
  replyText!: string;

  @ApiProperty({ enum: ['OWNER', 'ADMIN'], example: 'OWNER' })
  @IsString()
  role!: string;
}

export class ModerateReviewDto {
  @ApiProperty({ enum: ['HIDE', 'DELETE'], example: 'HIDE' })
  @IsString()
  action!: 'HIDE' | 'DELETE';
}
