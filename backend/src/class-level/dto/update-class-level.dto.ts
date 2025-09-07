import { IsArray, IsOptional, IsString, IsUUID } from 'class-validator';

export class UpdateClassLevelDto {
  @IsOptional()
  @IsString({ message: 'Class name must be text if provided.' })
  name?: string;

  @IsOptional()
  @IsString({ message: 'Description must be text if provided.' })
  description?: string;

  @IsOptional()
  @IsUUID('4', { message: 'Class teacher must field must not be empty.' })
  classTeacherId?: string;

  @IsOptional()
  @IsArray({ message: 'Teachers must be provided as a list of IDs.' })
  @IsUUID('4', { each: true, message: 'Each teacher ID must be valid.' })
  teacherIds?: string[];

  @IsOptional()
  @IsArray({ message: 'Students must be provided as a list of IDs.' })
  @IsUUID('4', { each: true, message: 'Each student ID must be valid.' })
  studentIds?: string[];
}
