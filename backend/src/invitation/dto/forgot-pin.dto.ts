import { IsEmail, IsNotEmpty } from 'class-validator';

export class ForgotPinDto {
  @IsNotEmpty()
  @IsEmail()
  email: string;
}
