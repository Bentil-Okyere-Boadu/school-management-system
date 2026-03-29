import { PartialType } from '@nestjs/mapped-types';
import { CreateSubtopicDto } from './create-subtopic.dto';
import { IsOptional, IsString } from 'class-validator';

export class UpdateSubtopicDto extends PartialType(CreateSubtopicDto) {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;
}
