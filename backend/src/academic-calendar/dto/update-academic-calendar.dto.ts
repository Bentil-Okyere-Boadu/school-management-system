import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class UpdateAcademicCalendarDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string;
} 