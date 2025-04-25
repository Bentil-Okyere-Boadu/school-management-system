import { IsEmail, IsNotEmpty, IsOptional } from 'class-validator';

export class InviteTeacherDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsNotEmpty()
  name: string;
  
  @IsOptional()
  idFormat?: 'long' | 'short'; // To determine if we use TCH2025001 or TEA25001 format
} 