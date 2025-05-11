import { IsNotEmpty, IsNumber, IsOptional, IsString, Min, Max } from 'class-validator';

export class CreateGradingSystemDto {
  @IsNotEmpty()
  @IsString()
  grade: string;

  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  @Max(100)
  minRange: number;

  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  @Max(100)
  maxRange: number;

  @IsOptional()
  @IsString()
  description?: string;
} 