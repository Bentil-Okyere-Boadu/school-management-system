import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  Min,
  IsEnum,
} from 'class-validator';

export class GradeSubmissionDto {
  @IsInt()
  @Min(0)
  @IsNotEmpty()
  score: number;

  @IsString()
  @IsOptional()
  feedback?: string;

  @IsEnum(['graded', 'returned'])
  @IsOptional()
  status?: 'graded' | 'returned';
}

