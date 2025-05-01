import { IsEmail, IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class InviteUserDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsNotEmpty()
  @IsUUID()
  roleId: string;

  @IsNotEmpty()
  @IsUUID()
  schoolId: string;
}
