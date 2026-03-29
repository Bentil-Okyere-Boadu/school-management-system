import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  IsUUID,
  IsOptional,
  IsBoolean,
  IsArray,
  ArrayMinSize,
} from 'class-validator';

export class CreateCurriculumDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiProperty({ type: [String], format: 'uuid', minItems: 1 })
  @IsNotEmpty()
  @IsArray()
  @ArrayMinSize(1)
  @IsUUID('4', { each: true })
  subjectCatalogIds: string[];

  @ApiPropertyOptional({
    description:
      'Academic term UUID — omit for a reusable (term-agnostic) curriculum; subtopic progress stays per term via completions',
  })
  @IsOptional()
  @IsUUID()
  academicTermId?: string;
}
