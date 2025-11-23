import { IsOptional, IsString, IsUUID } from 'class-validator';

export class UpdateTeacherTopicDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsUUID()
  @IsOptional()
  subjectCatalogId?: string;
}
