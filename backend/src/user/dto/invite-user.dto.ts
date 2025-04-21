import { IsEmail, IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class InviteUserDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsUUID()
  @IsNotEmpty()
  roleId: string;

  @IsUUID()
  @IsNotEmpty()
  schoolId: string;
}
