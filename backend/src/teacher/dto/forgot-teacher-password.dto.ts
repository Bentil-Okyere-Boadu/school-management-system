import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

/**
 * Same `identifier` as POST /teacher/login.
 * Use generated teacherId `ABC-00000-123-00001` (school = 5-digit schoolCode)
 * or an email that maps to exactly one tenant_directory teacher row.
 */
export class ForgotTeacherPasswordDto {
  @ApiProperty({
    example: 'ABC-00000-123-00001',
    description:
      'Generated teacherId, or email only if it belongs to exactly one school',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(320)
  identifier: string;
}
