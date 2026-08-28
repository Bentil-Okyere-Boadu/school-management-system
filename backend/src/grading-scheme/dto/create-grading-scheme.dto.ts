import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsIn,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { GradingSchemeBandDto } from './grading-scheme-band.dto';

export class CreateGradingSchemeDto {
  @ApiProperty({ example: 'WASSCE-style 2025/26' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(200)
  name: string;

  @ApiPropertyOptional({ example: 0, default: 0 })
  @IsOptional()
  @IsNumber()
  scoreScaleMin?: number;

  @ApiPropertyOptional({ example: 100, default: 100 })
  @IsOptional()
  @IsNumber()
  scoreScaleMax?: number;

  @ApiPropertyOptional({ example: 50, default: 50 })
  @IsOptional()
  @IsNumber()
  passMark?: number;

  @ApiPropertyOptional({
    enum: ['none', 'nearest', 'up', 'down'],
    default: 'nearest',
  })
  @IsOptional()
  @IsIn(['none', 'nearest', 'up', 'down'])
  rounding?: 'none' | 'nearest' | 'up' | 'down';

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  allowManualOverride?: boolean;

  @ApiPropertyOptional({ example: '2025/26 Term 1' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  effectiveFrom?: string | null;

  @ApiPropertyOptional({
    enum: ['school', 'classLevels'],
    default: 'school',
  })
  @IsOptional()
  @IsIn(['school', 'classLevels'])
  scopeType?: 'school' | 'classLevels';

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  classLevelIds?: string[];

  @ApiProperty({ type: [GradingSchemeBandDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => GradingSchemeBandDto)
  bands: GradingSchemeBandDto[];

  @ApiPropertyOptional({
    description: 'When true, activate immediately after create',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  activate?: boolean;
}
