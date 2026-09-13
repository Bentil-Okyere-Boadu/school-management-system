import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsNotEmpty, IsOptional, IsString, IsUUID, ValidateIf } from 'class-validator';

export class UpdateClassLevelDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsNotEmpty({ message: 'Class name cannot be empty.' })
  @IsString({ message: 'Class name must be text.' })
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Class teacher UUID. Send null to remove the assigned teacher.' })
  @ValidateIf(o => o.classTeacherId != null && o.classTeacherId !== '')
  @IsUUID('4', { message: 'classTeacherId must be a valid UUID.' })
  classTeacherId?: string | null;

  @ApiPropertyOptional({ type: [String], format: 'uuid' })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  teacherIds?: string[];

  @ApiPropertyOptional({ type: [String], format: 'uuid' })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  studentIds?: string[];
}
