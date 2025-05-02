import { IsEmail, IsOptional, IsString, IsUUID } from 'class-validator';

export class UpdateSuperAdminDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  password?: string;

  @IsOptional()
  @IsUUID()
  roleId?: string;
}
