import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class GradingSchemeBandDto {
  @ApiProperty({ example: 'A' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(16)
  code: string;

  @ApiProperty({ example: 'Excellent' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(120)
  label: string;

  @ApiPropertyOptional({ example: 'Outstanding performance' })
  @IsOptional()
  @IsString()
  description?: string | null;

  @ApiProperty({ example: 80 })
  @IsNumber()
  minScore: number;

  @ApiProperty({ example: 100 })
  @IsNumber()
  maxScore: number;

  @ApiPropertyOptional({ example: 0 })
  @IsOptional()
  @IsNumber()
  sortOrder?: number;
}
