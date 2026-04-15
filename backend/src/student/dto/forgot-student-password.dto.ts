import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

/** Email or student ID (same as login `identifier`). */
export class ForgotStudentPasswordDto {
  @ApiProperty({ example: 'student@school.com or STU-2024-001' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(320)
  identifier: string;
}
