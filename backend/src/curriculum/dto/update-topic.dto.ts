import { PartialType } from '@nestjs/mapped-types';
import { CreateTopicDto } from './create-topic.dto';
import { IsOptional, IsString, IsInt, Min, IsUUID } from 'class-validator';

export class UpdateTopicDto extends PartialType(CreateTopicDto) {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  order?: number;

  @IsOptional()
  @IsUUID()
  curriculumId?: string;
}
