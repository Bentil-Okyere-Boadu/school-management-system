import { IsEmail, IsIn, IsNotEmpty } from 'class-validator';

export class CreateUserDto {
  @IsNotEmpty()
  name: string;

  @IsEmail()
  email: string;

  @IsNotEmpty()
  password: string;

  @IsNotEmpty()
  @IsIn(['super_admin', 'school admin', 'teacher', 'student', 'parent'])
  role: string;
}
