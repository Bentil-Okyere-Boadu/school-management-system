import { IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateTeacherTopicDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  // subject = SubjectCatalog
  @IsUUID()
  @IsNotEmpty()
  subjectCatalogId: string;
}
