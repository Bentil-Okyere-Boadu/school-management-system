import { IsEmail } from 'class-validator';

export class ForgotTeacherPasswordDto {
  @IsEmail()
  email: string;
}
