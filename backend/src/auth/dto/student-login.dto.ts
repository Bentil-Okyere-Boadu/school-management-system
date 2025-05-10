import { IsNotEmpty, IsString } from 'class-validator';

export class StudentLoginDto {
  @IsNotEmpty()
  @IsString()
  identifier: string; // Can be email or studentId

  @IsNotEmpty()
  @IsString()
  pin: string;
} 