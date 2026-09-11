import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class ChangeEmailDto {
  @ApiProperty({ example: 'Pass@12345', description: 'Current password for identity confirmation' })
  @IsNotEmpty()
  @IsString()
  currentPassword: string;

  @ApiProperty({ example: 'admin.new@foodhub.com', description: 'New email address' })
  @IsNotEmpty()
  @IsEmail()
  newEmail: string;
}
