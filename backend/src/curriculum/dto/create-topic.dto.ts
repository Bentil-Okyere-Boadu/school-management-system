import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  IsUUID,
  IsOptional,
  IsInt,
  Min,
  IsDateString,
} from 'class-validator';

export class CreateTopicDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ minimum: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  order?: number;

  @ApiPropertyOptional({ description: 'Planned start date (ISO date)' })
  @IsOptional()
  @IsDateString()
  plannedStartDate?: string;

  @ApiPropertyOptional({ description: 'Planned end date (ISO date)' })
  @IsOptional()
  @IsDateString()
  plannedEndDate?: string;

  @ApiProperty({ description: 'Subject catalog UUID' })
  @IsNotEmpty()
  @IsUUID()
  subjectCatalogId: string;

  @ApiProperty({ description: 'Curriculum UUID' })
  @IsNotEmpty()
  @IsUUID()
  curriculumId: string;
}
