import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsUUID, IsOptional } from 'class-validator';

export class CreateCurriculumTopicNoteDto {
  @ApiProperty({ description: 'Topic UUID' })
  @IsNotEmpty()
  @IsUUID()
  topicId: string;

  @ApiPropertyOptional({ description: 'Subject UUID - omit for school-wide note' })
  @IsOptional()
  @IsUUID()
  subjectId?: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  content: string;

  @ApiPropertyOptional({ description: 'Parent note UUID for replies' })
  @IsOptional()
  @IsUUID()
  parentId?: string;

  @ApiPropertyOptional({
    description:
      'Academic term UUID — scopes the note to a term (recommended when topics are reused across terms)',
  })
  @IsOptional()
  @IsUUID()
  academicTermId?: string;
}
