import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  IsDateString,
  IsUUID,
  IsOptional,
  ValidateNested,
  IsArray,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CreateHolidayDto } from './create-holiday.dto';

export class CreateAcademicTermDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  termName: string;

  @ApiProperty({ example: '2025-01-06' })
  @IsNotEmpty()
  @IsDateString()
  startDate: string;

  @ApiProperty({ example: '2025-04-15' })
  @IsNotEmpty()
  @IsDateString()
  endDate: string;

  @ApiProperty({ description: 'Academic calendar UUID' })
  @IsNotEmpty()
  @IsUUID()
  academicCalendarId: string;

  @ApiPropertyOptional({ type: [CreateHolidayDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateHolidayDto)
  holidays?: CreateHolidayDto[];
}
