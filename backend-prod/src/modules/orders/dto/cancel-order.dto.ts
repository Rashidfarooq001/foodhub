import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CancelOrderDto {
  @ApiProperty({ example: 'Changed my mind about the order' })
  @IsString()
  @IsNotEmpty()
  reason!: string;
}
