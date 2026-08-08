import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class SendDeliveryOtpDto {
  @ApiProperty({ description: 'Order ID' })
  @IsString()
  @IsNotEmpty()
  orderId!: string;
}
