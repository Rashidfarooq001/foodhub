import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class VerifyPaymentDto {
  @ApiProperty({ example: 'order_LK2ndFhR4w3lMN' })
  @IsString()
  @IsNotEmpty()
  razorpayOrderId!: string;

  @ApiProperty({ example: 'pay_LK2pXmHhSk9qRT' })
  @IsString()
  @IsNotEmpty()
  razorpayPaymentId!: string;

  @ApiProperty({ example: 'abc123...sha256hash' })
  @IsString()
  @IsNotEmpty()
  razorpaySignature!: string;
}
