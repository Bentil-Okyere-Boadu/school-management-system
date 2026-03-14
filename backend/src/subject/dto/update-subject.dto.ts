import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsUUID } from 'class-validator';

export class UpdateSubjectDto {
  @ApiPropertyOptional({ description: 'Subject catalog UUID' })
  @IsOptional()
  @IsUUID()
  subjectCatalogId?: string;

  @ApiPropertyOptional({ type: [String], format: 'uuid' })
  @IsOptional()
  @IsUUID('4', { each: true })
  classLevelIds?: string[];

  @ApiPropertyOptional({ description: 'Teacher UUID' })
  @IsOptional()
  @IsUUID()
  teacherId?: string;
}
