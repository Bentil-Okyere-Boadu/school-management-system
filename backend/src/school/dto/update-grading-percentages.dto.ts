import { IsNumber, IsNotEmpty, Min, Max } from 'class-validator';

export class UpdateGradingPercentagesDto {
  @IsNotEmpty()
  schoolId: string;

  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  @Max(100)
  classScorePercentage: number;

  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  @Max(100)
  examScorePercentage: number;
}

