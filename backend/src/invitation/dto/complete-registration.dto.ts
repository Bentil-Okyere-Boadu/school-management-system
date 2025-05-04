import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class CompleteRegistrationDto {
  @IsNotEmpty()
  @IsString()
  token: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(8)
  password: string;
}
