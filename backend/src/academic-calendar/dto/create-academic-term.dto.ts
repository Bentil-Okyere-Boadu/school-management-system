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
  @IsNotEmpty()
  @IsString()
  termName: string;

  @IsNotEmpty()
  @IsDateString()
  startDate: string;

  @IsNotEmpty()
  @IsDateString()
  endDate: string;

  @IsNotEmpty()
  @IsUUID()
  academicCalendarId: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateHolidayDto)
  holidays?: CreateHolidayDto[];
}
