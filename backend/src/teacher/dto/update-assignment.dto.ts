import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';

export class UpdateAssignmentDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  title?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  instructions?: string;

  @ApiPropertyOptional({ example: '2025-12-31T23:59:59.000Z' })
  @IsDateString()
  @IsOptional()
  dueDate?: string;

  @ApiPropertyOptional({ minimum: 0, maximum: 1000 })
  @IsInt()
  @Min(0)
  @Max(1000)
  @IsOptional()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      const parsed = Number.parseInt(value, 10);
      return Number.isNaN(parsed) ? value : parsed;
    }
    return value as number;
  })
  @Type(() => Number)
  maxScore?: number;

  @ApiPropertyOptional({ enum: ['draft', 'published'] })
  @IsEnum(['draft', 'published'])
  @IsOptional()
  state?: 'draft' | 'published';

  @ApiPropertyOptional({ enum: ['online', 'offline'] })
  @IsEnum(['online', 'offline'])
  @IsOptional()
  assignmentType?: 'online' | 'offline';
}
