import { IsEmail, IsNotEmpty, IsUUID, IsOptional } from 'class-validator';

export class InviteUserDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsNotEmpty()
  name: string;

  @IsNotEmpty()
  role: string;

  @IsUUID()
  @IsOptional()
  schoolId?: string;
} 