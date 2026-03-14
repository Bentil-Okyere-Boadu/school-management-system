import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
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
  @ApiProperty({ description: 'Topic UUID' })
  @IsUUID()
  @IsNotEmpty()
  topicId: string;

  @ApiProperty({ description: 'Class level UUID' })
  @IsUUID()
  @IsNotEmpty()
  classLevelId: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  instructions?: string;

  @ApiProperty({ example: '2025-12-31T23:59:59.000Z', description: 'Due date (ISO 8601)' })
  @IsDateString()
  @IsNotEmpty()
  dueDate: string;

  @ApiProperty({ minimum: 0, maximum: 1000 })
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

  @ApiProperty({ enum: ['draft', 'published'] })
  @IsEnum(['draft', 'published'])
  state: 'draft' | 'published';

  @ApiPropertyOptional({ enum: ['online', 'offline'] })
  @IsEnum(['online', 'offline'])
  @IsOptional()
  assignmentType?: 'online' | 'offline';
}
