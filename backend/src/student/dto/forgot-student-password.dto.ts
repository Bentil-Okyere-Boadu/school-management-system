import { IsEmail } from 'class-validator';

export class ForgotStudentPasswordDto {
  @IsEmail()
  email: string;
}
