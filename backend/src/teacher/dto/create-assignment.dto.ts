import {
  IsDateString,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
} from 'class-validator';

export class CreateAssignmentDto {
  @IsUUID()
  @IsNotEmpty()
  topicId: string;

  @IsUUID()
  @IsNotEmpty()
  classLevelId: string;

  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsOptional()
  instructions?: string;

  @IsDateString()
  @IsNotEmpty()
  dueDate: string;

  @IsInt()
  @Min(0)
  @Max(1000)
  maxScore: number;

  @IsEnum(['draft', 'published'])
  state: 'draft' | 'published';
}
