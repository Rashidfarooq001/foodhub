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

export class AdminVerifySecurityQuestionsDto {
  @ApiProperty({ example: '2005-01-01', description: 'Date of birth in YYYY-MM-DD format' })
  @IsString()
  @IsNotEmpty()
  dob!: string;

  @ApiProperty({ example: 'Reshi', description: 'Favorite Person text' })
  @IsString()
  @IsNotEmpty()
  favoritePerson!: string;
}

export class AdminResetPasswordDto {
  @ApiProperty({ description: 'Short-lived single-use recovery token' })
  @IsString()
  @IsNotEmpty()
  resetToken!: string;

  @ApiProperty({ example: '9999888877776666', description: '16 numeric digits' })
  @IsString()
  @IsNotEmpty()
  @Matches(/^\d{16}$/, { message: 'Password 1 must be exactly 16 numeric digits' })
  newPassword1!: string;

  @ApiProperty({ example: '88887777', description: '8 numeric digits' })
  @IsString()
  @IsNotEmpty()
  @Matches(/^\d{8}$/, { message: 'Password 2 must be exactly 8 numeric digits' })
  newPassword2!: string;
}
