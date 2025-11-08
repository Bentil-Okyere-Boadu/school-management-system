import {
  IsNotEmpty,
  IsString,
  IsUUID,
  IsOptional,
  IsBoolean,
} from 'class-validator';

export class CreateCurriculumDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsNotEmpty()
  @IsUUID()
  subjectCatalogId: string;

  @IsNotEmpty()
  @IsUUID()
  academicTermId: string;
}
