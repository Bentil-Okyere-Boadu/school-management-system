import { IsEmail, IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class InviteUserDto {
  @IsNotEmpty()
  @IsString()
  firstName: string;

  @IsNotEmpty()
  @IsString()
  lastName: string;

  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsNotEmpty()
  @IsUUID()
  roleId?: string;
}
