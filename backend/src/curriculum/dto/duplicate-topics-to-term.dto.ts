import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsUUID,
  IsBoolean,
  IsOptional,
  IsArray,
  ArrayMinSize,
  ValidateIf,
} from 'class-validator';

export class DuplicateTopicsToTermDto {
  @ApiProperty({ description: 'Academic term to copy topics from' })
  @IsUUID()
  sourceAcademicTermId: string;

  @ApiProperty({ description: 'Academic term to create duplicated topics in' })
  @IsUUID()
  targetAcademicTermId: string;

  @ApiPropertyOptional({
    description:
      'When true, duplicate every topic whose effective term is the source term. Do not send topicIds.',
  })
  @IsOptional()
  @IsBoolean()
  duplicateAllFromSource?: boolean;

  @ApiPropertyOptional({
    type: [String],
    description:
      'Topic UUIDs to copy. Required unless duplicateAllFromSource is true.',
  })
  @ValidateIf(
    (o: DuplicateTopicsToTermDto) => o.duplicateAllFromSource !== true,
  )
  @IsArray()
  @ArrayMinSize(1)
  @IsUUID('4', { each: true })
  topicIds?: string[];
}
