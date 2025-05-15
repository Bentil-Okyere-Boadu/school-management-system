import { IsOptional, IsString } from 'class-validator';

export class UpdateAcademicCalendarDto {
  @IsOptional()
  @IsString()
  name?: string;
} 