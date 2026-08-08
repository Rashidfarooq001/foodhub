import { IsString, IsNotEmpty, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AdminTwoPasswordLoginDto {
  @ApiProperty({ example: '1234567890123456', description: '16 numeric digits' })
  @IsString()
  @IsNotEmpty()
  @Matches(/^\d{16}$/, { message: 'Password 1 must be exactly 16 numeric digits' })
  password1!: string;

  @ApiProperty({ example: '12345678', description: '8 numeric digits' })
  @IsString()
  @IsNotEmpty()
  @Matches(/^\d{8}$/, { message: 'Password 2 must be exactly 8 numeric digits' })
  password2!: string;
}
