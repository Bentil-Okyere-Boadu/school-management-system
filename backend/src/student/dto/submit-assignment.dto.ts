import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class SubmitAssignmentDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  notes?: string;
}

