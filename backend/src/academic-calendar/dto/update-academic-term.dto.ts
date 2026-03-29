import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsOptional,
  IsString,
  IsDateString,
  ValidateNested,
  IsArray,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CreateHolidayDto } from './create-holiday.dto';

export class UpdateAcademicTermDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  termName?: string;

  @ApiPropertyOptional({ example: '2025-01-06' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ example: '2025-04-15' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ type: [CreateHolidayDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateHolidayDto)
  holidays?: CreateHolidayDto[];
}
