import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
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
  @ApiProperty({ minimum: 0, maximum: 1000 })
  @IsInt()
  @Min(0)
  @IsNotEmpty()
  score: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  feedback?: string;

  @ApiPropertyOptional({ enum: ['graded', 'returned'] })
  @IsEnum(['graded', 'returned'])
  @IsOptional()
  status?: 'graded' | 'returned';
}

