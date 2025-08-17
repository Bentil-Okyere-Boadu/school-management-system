import { IsOptional, IsArray, IsUUID, IsString } from 'class-validator';

export class BulkStudentTargetingDto {
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  studentIds?: string[];

  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  classLevelIds?: string[];

  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  gradeIds?: string[];

  @IsOptional()
  @IsString()
  searchTerm?: string; // For searching students by name, email, etc.
}
