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
import { Transform, Type } from 'class-transformer';

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
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      const parsed = Number.parseInt(value, 10);
      return Number.isNaN(parsed) ? value : parsed;
    }
    return value as number;
  })
  @Type(() => Number)
  maxScore: number;

  @IsEnum(['draft', 'published'])
  state: 'draft' | 'published';

  @IsEnum(['online', 'offline'])
  @IsOptional()
  assignmentType?: 'online' | 'offline';
}
