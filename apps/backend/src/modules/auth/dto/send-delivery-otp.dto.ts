import { IsNotEmpty, IsString } from 'class-validator';

export class SendDeliveryOtpDto {
  @IsString()
  @IsNotEmpty()
  orderId: string;
}
