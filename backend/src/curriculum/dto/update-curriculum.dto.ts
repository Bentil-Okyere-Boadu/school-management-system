import { PartialType, OmitType } from '@nestjs/mapped-types';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { CreateCurriculumDto } from './create-curriculum.dto';
import {
  IsOptional,
  IsUUID,
  ValidateIf,
} from 'class-validator';

export class UpdateCurriculumDto extends PartialType(
  OmitType(CreateCurriculumDto, ['academicTermId'] as const),
) {
  @ApiPropertyOptional({
    nullable: true,
    description:
      'Academic term UUID, or null to unlink (term-agnostic curriculum)',
  })
  @IsOptional()
  @ValidateIf((_, v) => v !== null && v !== undefined)
  @IsUUID()
  academicTermId?: string | null;
}
