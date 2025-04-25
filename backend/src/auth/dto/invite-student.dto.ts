import { IsEmail, IsNotEmpty, IsUUID, IsOptional } from 'class-validator';

export class InviteStudentDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsNotEmpty()
  name: string;
  
  @IsOptional()
  idFormat?: 'long' | 'short'; // To determine if we use STD20250001 or S250001 format
} 