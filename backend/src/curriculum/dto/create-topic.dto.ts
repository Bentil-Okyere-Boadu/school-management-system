import {
  IsNotEmpty,
  IsString,
  IsUUID,
  IsOptional,
  IsInt,
  Min,
} from 'class-validator';

export class CreateTopicDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  order?: number;

  @IsNotEmpty()
  @IsUUID()
  subjectCatalogId: string;

  @IsNotEmpty()
  @IsUUID()
  curriculumId: string; // For validation - ensures subject catalog belongs to curriculum
}
