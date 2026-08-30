import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsInt, IsOptional, IsString, Min } from 'class-validator';

export class FinanceStudentDetailQueryDto {
  @ApiPropertyOptional({ description: 'Filter payments by academic term UUID' })
  @IsOptional()
  @IsString()
  academicTermId?: string;

  @ApiPropertyOptional({
    description: 'Filter payments by academic calendar (school year) UUID',
  })
  @IsOptional()
  @IsString()
  academicCalendarId?: string;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Transform(({ value }) => parseInt(String(value), 10))
  @IsInt()
  @Min(1)
  paymentPage?: number = 1;

  @ApiPropertyOptional({ default: 15 })
  @IsOptional()
  @Transform(({ value }) => parseInt(String(value), 10))
  @IsInt()
  @Min(1)
  paymentLimit?: number = 15;
}
