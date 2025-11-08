import { PartialType } from '@nestjs/mapped-types';
import { CreateCurriculumDto } from './create-curriculum.dto';
import { IsOptional, IsString, IsBoolean, IsUUID } from 'class-validator';

export class UpdateCurriculumDto extends PartialType(CreateCurriculumDto) {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsUUID()
  subjectCatalogId?: string;

  @IsOptional()
  @IsUUID()
  academicTermId?: string;
}
