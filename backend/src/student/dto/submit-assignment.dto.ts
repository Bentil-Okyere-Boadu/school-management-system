import { IsOptional, IsString } from 'class-validator';

export class SubmitAssignmentDto {
  @IsString()
  @IsOptional()
  notes?: string;
}

