import { IsString, IsNotEmpty, IsNumber, IsBoolean, IsOptional, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateFoodItemDto {
  @ApiProperty({ example: 'Paneer Butter Masala' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiPropertyOptional({ example: 'Cottage cheese in rich tomato gravy' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ example: 280 })
  @IsNumber()
  @Min(0)
  price!: number;

  @ApiProperty({ example: true })
  @IsBoolean()
  isVeg!: boolean;

  @ApiProperty({ example: 'rest-uuid-101' })
  @IsString()
  @IsNotEmpty()
  restaurantId!: string;

  @ApiProperty({ example: 'cat-uuid-main-course' })
  @IsString()
  @IsNotEmpty()
  categoryId!: string;

  @ApiPropertyOptional({ example: 'subcat-uuid-curries' })
  @IsString()
  @IsOptional()
  subCategoryId?: string;
}
