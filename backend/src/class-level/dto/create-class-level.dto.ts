import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  ValidateIf,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateClassLevelDto {
  @ApiProperty()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsNotEmpty({ message: 'Class name is required.' })
  @IsString({ message: 'Class name must be text.' })
  name: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Class teacher UUID' })
  @ValidateIf((o) => o.classTeacherId != null)
  @IsUUID('4', { message: 'classTeacherId must be a valid UUID.' })
  classTeacherId?: string;

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
