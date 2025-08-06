import { IsNotEmpty, IsUUID } from 'class-validator';

export class CreateSubjectDto {
  @IsNotEmpty()
  @IsUUID()
  subjectCatalogId: string;

  @IsNotEmpty()
  @IsUUID('4', { each: true })
  classLevelIds: string[]; 

  @IsNotEmpty()
  @IsUUID()
  teacherId: string;
}
