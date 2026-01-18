import { IsArray, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateClassLevelDto {
  @IsString({ message: 'Class name is required and must be text.' })
  name: string;

  @IsOptional()
  @IsString({ message: 'Description must be text if provided.' })
  description?: string;

  @IsOptional()
  @IsUUID('4', {
    message: 'Class teacher is required for a class',
  })
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
