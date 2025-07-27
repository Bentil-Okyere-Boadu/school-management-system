import { IsOptional, IsUUID } from 'class-validator';

export class UpdateSubjectDto {
  @IsOptional()
  @IsUUID()
  subjectCatalogId?: string;

  @IsOptional()
  @IsUUID('4', { each: true })
  classLevelIds?: string[];

  @IsOptional()
  @IsUUID()
  teacherId?: string;
}
