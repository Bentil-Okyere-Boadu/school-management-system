import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsEnum,
  IsUUID,
  IsDateString,
  IsArray,
} from 'class-validator';

export class CreateFeeStructureDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  feeTitle: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  feeType: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  amount: number;

  @ApiPropertyOptional({ enum: ['all', 'new', 'continuing'], default: 'all' })
  @IsOptional()
  @IsEnum(['all', 'new', 'continuing'], {
    message:
      'appliesTo must be one of the following values: all, new, continuing',
  })
  appliesTo?: 'all' | 'new' | 'continuing' = 'all';

  @ApiPropertyOptional({ example: '2025-12-31' })
  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @ApiPropertyOptional({ type: [String], format: 'uuid' })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  classLevelIds?: string[];
}
