import { IsEmail, IsNotEmpty } from 'class-validator';

export class ForgotPinDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;
}
