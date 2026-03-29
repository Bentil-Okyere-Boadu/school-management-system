import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsNotEmpty, Min, Max, IsString } from 'class-validator';

export class UpdateGradingPercentagesDto {
  @ApiProperty({ description: 'School UUID' })
  @IsNotEmpty()
  @IsString()
  schoolId: string;

  @ApiProperty({ minimum: 0, maximum: 100 })
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  @Max(100)
  classScorePercentage: number;

  @ApiProperty({ minimum: 0, maximum: 100 })
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  @Max(100)
  examScorePercentage: number;
}

