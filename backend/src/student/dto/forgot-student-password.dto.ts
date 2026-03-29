import { ApiProperty } from '@nestjs/swagger';
import { IsEmail } from 'class-validator';

export class ForgotStudentPasswordDto {
  @ApiProperty({ example: 'student@school.com' })
  @IsEmail()
  email: string;
}
