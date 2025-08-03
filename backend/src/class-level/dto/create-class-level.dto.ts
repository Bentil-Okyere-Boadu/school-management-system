import { IsArray, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateClassLevelDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsUUID('4')
  classTeacherId?: string;

  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  teacherIds?: string[];

  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  studentIds?: string[];
}