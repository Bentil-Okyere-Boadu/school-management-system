import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty } from 'class-validator';

export class ForgotPinDto {
  @ApiProperty({ example: 'user@school.com' })
  @IsNotEmpty()
  @IsEmail()
  email: string;
}
