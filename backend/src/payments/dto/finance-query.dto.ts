import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class FinanceQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @Transform(({ value }) => parseInt(String(value), 10))
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(({ value }) => parseInt(String(value), 10))
  @IsInt()
  @Min(1)
  limit?: number = 20;

  @ApiPropertyOptional({ description: 'Student name or student code' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Filter by class level UUID' })
  @IsOptional()
  @IsString()
  classLevelId?: string;

  @ApiPropertyOptional({
    enum: ['all', 'owing', 'clear', 'prepaid'],
    description:
      'owing: netBalance > 0; clear: netBalance === 0 and prepayment === 0; prepaid: prepayment > 0',
  })
  @IsOptional()
  @IsIn(['all', 'owing', 'clear', 'prepaid'])
  balanceStatus?: 'all' | 'owing' | 'clear' | 'prepaid' = 'all';
}
