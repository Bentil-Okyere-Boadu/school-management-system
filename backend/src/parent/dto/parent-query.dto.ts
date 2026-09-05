import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsUUID, Max, Min } from 'class-validator';

export class ParentOverviewQueryDto {
  @ApiPropertyOptional({ description: 'Limit overview to one active child' })
  @IsOptional()
  @IsUUID()
  studentId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  calendarId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  termId?: string;
}

export class ParentAttendanceQueryDto {
  @ApiPropertyOptional({ description: 'Limit attendance to one active child' })
  @IsOptional()
  @IsUUID()
  studentId?: string;

  @ApiPropertyOptional({ minimum: 1, maximum: 12, example: 8 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(12)
  month?: number;

  @ApiPropertyOptional({ example: 2026 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(2000)
  year?: number;
}

export class ParentChildAttendanceQueryDto {
  @ApiPropertyOptional({ minimum: 1, maximum: 12, example: 8 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(12)
  month?: number;

  @ApiPropertyOptional({ example: 2026 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(2000)
  year?: number;
}

export class ParentFinanceQueryDto {
  @ApiPropertyOptional({ description: 'Limit finance to one active child' })
  @IsOptional()
  @IsUUID()
  studentId?: string;
}

export class ParentAcademicsQueryDto {
  @ApiProperty({ description: 'Academic calendar to load published results for' })
  @IsUUID()
  calendarId: string;

  @ApiPropertyOptional({ description: 'Limit academics to one active child' })
  @IsOptional()
  @IsUUID()
  studentId?: string;
}

export class ParentPerformanceAnalyticsQueryDto {
  @ApiProperty({ description: 'Academic term to load performance analytics for' })
  @IsUUID()
  academicTermId: string;

  @ApiPropertyOptional({
    description: 'Limit performance analytics to one active child',
  })
  @IsOptional()
  @IsUUID()
  studentId?: string;
}
