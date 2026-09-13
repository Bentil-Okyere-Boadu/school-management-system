import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

/**
 * Same `identifier` as POST /student/login.
 * Use generated studentId `ABC-00000-120-00001` (school = 5-digit schoolCode)
 * or an email that maps to exactly one tenant_directory student row.
 */
export class ForgotStudentPasswordDto {
  @ApiProperty({
    example: 'ABC-00000-120-00001',
    description:
      'Generated studentId, or email only if it belongs to exactly one school',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(320)
  identifier: string;
}
