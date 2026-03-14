import { ApiProperty } from '@nestjs/swagger';
import { IsEmail } from 'class-validator';

export class ForgotTeacherPasswordDto {
  @ApiProperty({ example: 'teacher@school.com' })
  @IsEmail()
  email: string;
}
