import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

/** Email or teacher ID (same as login `identifier`). */
export class ForgotTeacherPasswordDto {
  @ApiProperty({ example: 'teacher@school.com or TCH-001' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(320)
  identifier: string;
}
