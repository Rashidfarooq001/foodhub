import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class VerifyWidgetDto {
  @ApiProperty({ description: 'MSG91 OTP widget access token' })
  @IsString()
  @IsNotEmpty()
  accessToken!: string;
}
