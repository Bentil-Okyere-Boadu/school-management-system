import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { GradingSchemeBandDto } from './grading-scheme-band.dto';

export class UpdateGradingSchemeDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(200)
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  scoreScaleMin?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  scoreScaleMax?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  passMark?: number;

  @ApiPropertyOptional({ enum: ['none', 'nearest', 'up', 'down'] })
  @IsOptional()
  @IsIn(['none', 'nearest', 'up', 'down'])
  rounding?: 'none' | 'nearest' | 'up' | 'down';

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  allowManualOverride?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(120)
  effectiveFrom?: string | null;

  @ApiPropertyOptional({ enum: ['school', 'classLevels'] })
  @IsOptional()
  @IsIn(['school', 'classLevels'])
  scopeType?: 'school' | 'classLevels';

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  classLevelIds?: string[];

  @ApiPropertyOptional({ type: [GradingSchemeBandDto] })
  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => GradingSchemeBandDto)
  bands?: GradingSchemeBandDto[];
}
