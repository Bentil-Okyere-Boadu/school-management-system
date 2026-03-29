import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString, Min, Max } from 'class-validator';

export class CreateGradingSystemDto {
  @ApiProperty({ example: 'A' })
  @IsNotEmpty()
  @IsString()
  grade: string;

  @ApiProperty({ minimum: 0, maximum: 100 })
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  @Max(100)
  minRange: number;

  @ApiProperty({ minimum: 0, maximum: 100 })
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  @Max(100)
  maxRange: number;
}
