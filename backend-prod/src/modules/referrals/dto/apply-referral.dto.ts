import { IsString, IsNotEmpty, Length } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ApplyReferralDto {
  @ApiProperty({ example: 'FH-A3BK9Z', description: 'Referral code from a friend' })
  @IsString()
  @IsNotEmpty()
  @Length(8, 8)
  code!: string;
}
