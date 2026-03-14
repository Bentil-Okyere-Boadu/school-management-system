import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  IsUUID,
  IsOptional,
  IsInt,
  Min,
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

  @ApiProperty({ description: 'Subject catalog UUID' })
  @IsNotEmpty()
  @IsUUID()
  subjectCatalogId: string;

  @ApiProperty({ description: 'Curriculum UUID' })
  @IsNotEmpty()
  @IsUUID()
  curriculumId: string;
}
