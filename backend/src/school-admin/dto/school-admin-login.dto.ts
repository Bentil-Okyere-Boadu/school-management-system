import { IsEmail, IsString, MinLength } from 'class-validator';

export class SchoolAdminLoginDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  password: string;
}
